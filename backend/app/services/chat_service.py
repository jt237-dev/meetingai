"""Service du chatbot : répond aux questions de l'utilisateur en s'appuyant
sur l'historique des réunions stockées en base.

Stratégie « filtrage intelligent » en deux temps pour rester économique et
scalable à des centaines de réunions :

1. PRÉ-FILTRAGE (sans IA) : on ne charge que des métadonnées légères de toutes
   les réunions (id, titre, date, résumé court, quelques champs texte). On
   score chaque réunion selon le nombre de mots de la question qu'elle contient,
   et on ne garde que les meilleures candidates. Ainsi, même avec beaucoup de
   réunions, on n'envoie qu'un petit sous-ensemble à l'IA.

2. RÉPONSE CIBLÉE (Haiku) : on envoie uniquement les réunions candidates à
   Claude, qui rédige une réponse et cite les réunions pertinentes par leur id.
   On renvoie au frontend la réponse + la liste des références (id, titre, date)
   pour afficher des liens cliquables vers la page de détail.
"""

import json
import re
import unicodedata

import anthropic
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.meeting import Meeting

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

# Nombre maximal de réunions candidates envoyées à l'IA (borne le coût).
MAX_CANDIDATES = 8

# Mots vides à ignorer dans le pré-filtrage (ils n'aident pas à discriminer).
_STOPWORDS = {
    "le", "la", "les", "un", "une", "des", "de", "du", "au", "aux", "et", "ou",
    "qui", "que", "quoi", "quel", "quelle", "quels", "quelles", "est", "sont",
    "a", "as", "ont", "dans", "sur", "pour", "par", "avec", "sans", "ce", "cet",
    "cette", "ces", "il", "elle", "on", "nous", "vous", "ils", "elles", "se",
    "sa", "son", "ses", "leur", "leurs", "en", "y", "d", "l", "quelle", "quels",
    "parle", "parlait", "parlé", "reunion", "réunion", "reunions", "réunions",
    "montre", "donne", "dire", "dis", "trouve", "cherche", "liste",
}


def _normalize(text: str) -> str:
    """Minuscule + suppression des accents, pour un matching robuste."""
    text = text.lower()
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return text


def _keywords(question: str) -> list[str]:
    """Extrait les mots significatifs de la question (>= 3 lettres, hors stopwords)."""
    words = re.findall(r"\w+", _normalize(question))
    return [w for w in words if len(w) >= 3 and w not in _STOPWORDS]


def _meeting_haystack(m: Meeting) -> str:
    """Concatène les champs texte d'une réunion pour le scoring de pertinence."""
    parts = [
        m.title or "",
        m.summary or "",
        m.problematique or "",
        m.objectifs or "",
        m.decisions or "",
        m.solutions or "",
        m.activites_recommandations or "",
        m.president or "",
        m.rapporteur or "",
        m.lieu or "",
    ]
    return _normalize(" ".join(parts))


def _select_candidates(meetings: list[Meeting], question: str) -> list[Meeting]:
    """Pré-filtrage : score chaque réunion par nombre de mots-clés présents.

    Si la question ne contient aucun mot-clé exploitable (ex: "bonjour"), ou si
    aucune réunion ne matche, on renvoie les réunions les plus récentes pour que
    l'IA ait quand même de quoi répondre.
    """
    kws = _keywords(question)

    if not kws:
        return sorted(meetings, key=lambda m: m.date or 0, reverse=True)[:MAX_CANDIDATES]

    scored = []
    for m in meetings:
        hay = _meeting_haystack(m)
        score = sum(1 for kw in kws if kw in hay)
        if score > 0:
            scored.append((score, m))

    if not scored:
        # Aucun match direct : on donne les plus récentes en repli.
        return sorted(meetings, key=lambda m: m.date or 0, reverse=True)[:MAX_CANDIDATES]

    # Tri par score décroissant, puis par date récente à score égal.
    scored.sort(key=lambda t: (t[0], t[1].date or 0), reverse=True)
    return [m for _, m in scored[:MAX_CANDIDATES]]


def _parse_json_field(value):
    if not value:
        return []
    if isinstance(value, list):
        return value
    try:
        return json.loads(value)
    except Exception:
        return []


def _meeting_context(m: Meeting) -> str:
    """Résumé compact d'une réunion, injecté dans le prompt de l'IA."""
    date_str = m.date.strftime("%d/%m/%Y") if m.date else "date inconnue"
    decisions = _parse_json_field(m.decisions)
    objectifs = _parse_json_field(m.objectifs)

    lines = [
        f"[Réunion id={m.id}] {m.title} (du {date_str})",
    ]
    if m.summary:
        lines.append(f"  Résumé : {m.summary}")
    if objectifs:
        lines.append("  Objectifs : " + " ; ".join(str(o) for o in objectifs[:5]))
    if decisions:
        lines.append("  Décisions : " + " ; ".join(str(d) for d in decisions[:5]))
    if m.president:
        lines.append(f"  Président : {m.president}")
    return "\n".join(lines)


def answer_question(question: str, db: Session) -> dict:
    """Répond à une question sur l'historique des réunions.

    Renvoie un dict : {"answer": str, "references": [{"id", "title", "date"}]}
    """
    # On ne considère que les réunions réellement analysées (avec du contenu).
    meetings = (
        db.query(Meeting)
        .filter(Meeting.summary.isnot(None))
        .all()
    )

    if not meetings:
        return {
            "answer": "Aucune réunion analysée n'est encore disponible. "
                      "Importez et analysez une réunion pour que je puisse répondre.",
            "references": [],
        }

    candidates = _select_candidates(meetings, question)
    context = "\n\n".join(_meeting_context(m) for m in candidates)

    prompt = f"""Tu es l'assistant d'une application de comptes rendus de réunion.
Tu réponds aux questions de l'utilisateur en t'appuyant UNIQUEMENT sur les
réunions listées ci-dessous. Ne fabrique jamais d'information absente de ces
réunions.

RÉUNIONS DISPONIBLES :
{context}

QUESTION DE L'UTILISATEUR :
{question}

CONSIGNES :
- Réponds de façon claire et concise, en français.
- Cite les réunions pertinentes en les désignant par leur id.
- Si aucune réunion ne correspond, dis-le honnêtement.
- Réponds UNIQUEMENT avec un JSON valide, sans texte avant/après, sans backticks,
  au format exact :
{{
  "answer": "ta réponse rédigée pour l'utilisateur (sans mentionner les id bruts, parle des réunions par leur titre)",
  "meeting_ids": [liste des id (nombres entiers) des réunions réellement pertinentes, ou liste vide]
}}"""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        temperature=0,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()

    # Extraction robuste du JSON.
    try:
        start = raw.find("{")
        end = raw.rfind("}") + 1
        parsed = json.loads(raw[start:end])
    except Exception:
        # Repli : on renvoie le texte brut sans références.
        return {"answer": raw, "references": []}

    answer = parsed.get("answer", "").strip() or "Je n'ai pas trouvé de réponse."
    ids = parsed.get("meeting_ids", []) or []

    # Construit les références cliquables à partir des id retournés.
    by_id = {m.id: m for m in candidates}
    references = []
    for mid in ids:
        m = by_id.get(mid)
        if m:
            references.append({
                "id": m.id,
                "title": m.title,
                "date": m.date.isoformat() if m.date else None,
            })

    return {"answer": answer, "references": references}
