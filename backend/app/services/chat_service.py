"""Service du chatbot : répond aux questions de l'utilisateur en s'appuyant
sur l'historique des réunions stockées en base.

Stratégie « filtrage intelligent » en deux temps, économique et scalable :

1. PRÉ-FILTRAGE (sans IA) : on charge des métadonnées légères de toutes les
   réunions et on score chacune selon le nombre de mots de la question qu'elle
   contient. On ne garde que les meilleures candidates. Ainsi, même avec des
   centaines de réunions, on n'envoie qu'un petit sous-ensemble à l'IA.

2. RÉPONSE DÉTAILLÉE (Haiku) : pour ces quelques candidates, on envoie à Claude
   leur CONTENU STRUCTURÉ COMPLET (résumé, objectifs, décisions, recommandations
   détaillées, tâches, résolutions, participants, etc.). Claude peut alors
   répondre à des questions précises du type « quelle est la première
   recommandation de la réunion sur les GAB ? » — ce qui serait impossible avec
   un simple résumé. On renvoie la réponse + les références cliquables.
"""

import json
import re
import unicodedata

import anthropic
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.meeting import Meeting

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

# Nombre maximal de réunions détaillées envoyées à l'IA (borne le coût).
MAX_CANDIDATES = 4

_STOPWORDS = {
    "le", "la", "les", "un", "une", "des", "de", "du", "au", "aux", "et", "ou",
    "qui", "que", "quoi", "quel", "quelle", "quels", "quelles", "est", "sont",
    "a", "as", "ont", "dans", "sur", "pour", "par", "avec", "sans", "ce", "cet",
    "cette", "ces", "il", "elle", "on", "nous", "vous", "ils", "elles", "se",
    "sa", "son", "ses", "leur", "leurs", "en", "y", "d", "l", "premiere",
    "premier", "deuxieme", "troisieme", "derniere", "dernier",
    "parle", "parlait", "parle", "reunion", "reunion", "reunions", "reunions",
    "montre", "donne", "dire", "dis", "trouve", "cherche", "liste",
}


def _normalize(text: str) -> str:
    text = text.lower()
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return text


def _keywords(question: str) -> list[str]:
    words = re.findall(r"\w+", _normalize(question))
    return [w for w in words if len(w) >= 3 and w not in _STOPWORDS]


def _parse_json_field(value):
    if not value:
        return []
    if isinstance(value, list):
        return value
    try:
        parsed = json.loads(value)
        return parsed if isinstance(parsed, list) else []
    except Exception:
        return []


def _meeting_haystack(m: Meeting) -> str:
    parts = [
        m.title or "", m.summary or "", m.problematique or "",
        m.objectifs or "", m.decisions or "", m.solutions or "",
        m.activites_recommandations or "", m.resolutions or "",
        m.consequences or "", m.faits_saillants or "", m.points_veille or "",
        m.divers or "", m.president or "", m.rapporteur or "", m.lieu or "",
    ]
    return _normalize(" ".join(parts))


def _select_candidates(meetings, question):
    kws = _keywords(question)
    if not kws:
        return sorted(meetings, key=lambda m: m.date or 0, reverse=True)[:MAX_CANDIDATES]

    scored = []
    for m in meetings:
        hay = _meeting_haystack(m)
        score = sum(hay.count(kw) for kw in kws)
        if score > 0:
            scored.append((score, m))

    if not scored:
        return sorted(meetings, key=lambda m: m.date or 0, reverse=True)[:MAX_CANDIDATES]

    scored.sort(key=lambda t: (t[0], t[1].date or 0), reverse=True)
    return [m for _, m in scored[:MAX_CANDIDATES]]


def _format_list(items, numbered=False, limit=None):
    if not items:
        return None
    if limit:
        items = items[:limit]
    lines = []
    for i, it in enumerate(items, 1):
        prefix = f"{i}. " if numbered else "- "
        if isinstance(it, dict):
            parts = [f"{k}: {v}" for k, v in it.items() if v not in (None, "", [])]
            lines.append(prefix + " | ".join(parts))
        else:
            lines.append(prefix + str(it))
    return "\n".join(lines)


def _meeting_detail(m: Meeting) -> str:
    date_str = m.date.strftime("%d/%m/%Y") if m.date else "date inconnue"
    blocks = [f"=== REUNION id={m.id} : « {m.title} » (du {date_str}) ==="]

    if m.president:
        blocks.append(f"President : {m.president}")
    if m.rapporteur:
        blocks.append(f"Rapporteur : {m.rapporteur}")
    if m.summary:
        blocks.append(f"Resume : {m.summary}")
    if m.problematique:
        blocks.append(f"Problematique : {m.problematique}")

    objectifs = _format_list(_parse_json_field(m.objectifs), numbered=True)
    if objectifs:
        blocks.append("Objectifs :\n" + objectifs)

    recos = _format_list(_parse_json_field(m.activites_recommandations), numbered=True)
    if recos:
        blocks.append("Recommandations / dossiers (dans l'ordre) :\n" + recos)

    solutions = _format_list(_parse_json_field(m.solutions), numbered=True)
    if solutions:
        blocks.append("Solutions proposees :\n" + solutions)

    decisions = _format_list(_parse_json_field(m.decisions), numbered=True)
    if decisions:
        blocks.append("Decisions prises :\n" + decisions)

    resolutions = _format_list(_parse_json_field(m.resolutions), numbered=True)
    if resolutions:
        blocks.append("Resolutions :\n" + resolutions)

    tasks = _format_list(_parse_json_field(m.tasks), numbered=True)
    if tasks:
        blocks.append("Taches / plan d'action :\n" + tasks)

    consequences = _format_list(_parse_json_field(m.consequences))
    if consequences:
        blocks.append("Consequences / impacts :\n" + consequences)

    try:
        names = [p.name for p in m.participants if getattr(p, "name", None)]
        if names:
            blocks.append("Participants : " + ", ".join(names))
    except Exception:
        pass

    if m.points_veille:
        blocks.append(f"Points de veille : {m.points_veille}")
    if m.faits_saillants:
        blocks.append(f"Faits saillants : {m.faits_saillants}")
    if m.divers:
        blocks.append(f"Divers : {m.divers}")

    return "\n".join(blocks)


def answer_question(question: str, db: Session) -> dict:
    meetings = db.query(Meeting).filter(Meeting.summary.isnot(None)).all()

    if not meetings:
        return {
            "answer": "Aucune reunion analysee n'est encore disponible. "
                      "Importez et analysez une reunion pour que je puisse repondre.",
            "references": [],
        }

    candidates = _select_candidates(meetings, question)
    context = "\n\n".join(_meeting_detail(m) for m in candidates)

    prompt = f"""Tu es un assistant intelligent specialise dans l'analyse de comptes
rendus de reunion. Tu reponds aux questions de l'utilisateur en t'appuyant
UNIQUEMENT sur les reunions detaillees ci-dessous. Tu raisonnes precisement :
si on te demande « la premiere recommandation », tu prends l'element n1 de la
liste des recommandations de la bonne reunion ; si on demande « qui est charge
de telle tache », tu regardes le champ correspondant, etc.

Ne fabrique jamais d'information absente de ces reunions. Si l'information
demandee n'y figure pas, dis-le clairement.

REUNIONS DISPONIBLES (contenu detaille) :
{context}

QUESTION DE L'UTILISATEUR :
{question}

CONSIGNES DE REPONSE :
- Reponds de facon precise, claire et naturelle, en francais, comme le ferait un
  assistant intelligent. Cite le contenu exact quand c'est pertinent.
- Quand la question porte sur un element ordonne (premiere/deuxieme/derniere
  recommandation, tache, decision...), identifie le bon element par sa position.
- Designe les reunions par leur titre (pas par leur id brut) dans ta reponse.
- Reponds UNIQUEMENT avec un JSON valide, sans texte avant/apres, sans backticks :
{{
  "answer": "ta reponse redigee pour l'utilisateur",
  "meeting_ids": [liste des id (entiers) des reunions reellement utilisees, ou liste vide]
}}"""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1500,
        temperature=0,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()

    try:
        start = raw.find("{")
        end = raw.rfind("}") + 1
        parsed = json.loads(raw[start:end])
    except Exception:
        return {"answer": raw, "references": []}

    answer = parsed.get("answer", "").strip() or "Je n'ai pas trouve de reponse."
    ids = parsed.get("meeting_ids", []) or []

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