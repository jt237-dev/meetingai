"""Service du chatbot : répond aux questions sur l'historique des réunions.

Architecture en DEUX APPELS pour minimiser le coût tout en gardant la précision :

  Étape 0 - PRÉ-FILTRAGE (sans IA, gratuit) : score des réunions par mots-clés
            de la question, on ne garde que quelques candidates.

  Étape 1 - ROUTEUR (appel IA léger) : on envoie seulement titre + résumé court
            de chaque candidate, et l'IA choisit la/les 1-2 réunion(s) vraiment
            nécessaire(s) pour répondre. Peu de tokens -> quasi gratuit.

  Étape 2 - RÉPONSE (appel IA ciblé) : on n'envoie le CONTENU DÉTAILLÉ que des
            1-2 réunions choisies, et l'IA rédige la réponse précise.

Au lieu de détailler 4 réunions à chaque question (coûteux), on ne détaille que
celles réellement utiles -> coût divisé, précision conservée.
"""

import json
import re
import unicodedata

import anthropic
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.meeting import Meeting

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

MODEL = "claude-haiku-4-5-20251001"

# Candidates issues du pré-filtrage (envoyées au routeur, en version courte).
MAX_CANDIDATES = 6
# Réunions réellement détaillées pour la réponse (limite le coût de l'appel 2).
MAX_DETAILED = 2

_STOPWORDS = {
    "le", "la", "les", "un", "une", "des", "de", "du", "au", "aux", "et", "ou",
    "qui", "que", "quoi", "quel", "quelle", "quels", "quelles", "est", "sont",
    "a", "as", "ont", "dans", "sur", "pour", "par", "avec", "sans", "ce", "cet",
    "cette", "ces", "il", "elle", "on", "nous", "vous", "ils", "elles", "se",
    "sa", "son", "ses", "leur", "leurs", "en", "y", "d", "l", "premiere",
    "premier", "deuxieme", "troisieme", "derniere", "dernier",
    "parle", "parlait", "reunion", "reunions",
    "montre", "donne", "dire", "dis", "trouve", "cherche", "liste",
}


def _normalize(text: str) -> str:
    text = text.lower()
    text = unicodedata.normalize("NFD", text)
    return "".join(c for c in text if unicodedata.category(c) != "Mn")


def _keywords(question: str):
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


def _short(text, n=220):
    if not text:
        return ""
    text = str(text).strip().replace("\n", " ")
    return text[:n] + ("…" if len(text) > n else "")


def _format_list(items, numbered=False):
    if not items:
        return None
    lines = []
    for i, it in enumerate(items, 1):
        prefix = f"{i}. " if numbered else "- "
        if isinstance(it, dict):
            parts = [f"{k}: {v}" for k, v in it.items() if v not in (None, "", [])]
            lines.append(prefix + " | ".join(parts))
        else:
            lines.append(prefix + str(it))
    return "\n".join(lines)


def _meeting_short(m: Meeting) -> str:
    """Version COURTE (routeur) : juste de quoi choisir la bonne réunion."""
    date_str = m.date.strftime("%d/%m/%Y") if m.date else "date inconnue"
    return f"id={m.id} | « {m.title} » (du {date_str}) | Résumé: {_short(m.summary)}"


def _meeting_detail(m: Meeting) -> str:
    """Version DÉTAILLÉE (réponse) : tout le contenu structuré numéroté."""
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

    for label, field, numbered in [
        ("Objectifs", m.objectifs, True),
        ("Recommandations / dossiers (dans l'ordre)", m.activites_recommandations, True),
        ("Solutions proposees", m.solutions, True),
        ("Decisions prises", m.decisions, True),
        ("Resolutions", m.resolutions, True),
        ("Taches / plan d'action", m.tasks, True),
        ("Consequences / impacts", m.consequences, False),
    ]:
        formatted = _format_list(_parse_json_field(field), numbered=numbered)
        if formatted:
            blocks.append(f"{label} :\n{formatted}")

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


def _extract_json(raw: str):
    try:
        start = raw.find("{")
        end = raw.rfind("}") + 1
        return json.loads(raw[start:end])
    except Exception:
        return None


def _route(question: str, candidates) -> list:
    """Appel 1 (léger) : l'IA choisit les réunions pertinentes parmi les résumés."""
    if len(candidates) <= 1:
        return candidates  # rien à router, on détaille directement

    listing = "\n".join(_meeting_short(m) for m in candidates)
    prompt = f"""Voici une liste de reunions (titre + resume court).
Question de l'utilisateur : "{question}"

REUNIONS :
{listing}

Indique quelles reunions il faut ouvrir en detail pour repondre a la question.
Choisis-en le MOINS possible (idealement 1, au maximum 2).
Reponds UNIQUEMENT par un JSON : {{"meeting_ids": [ids entiers]}}"""

    msg = client.messages.create(
        model=MODEL,
        max_tokens=100,
        temperature=0,
        messages=[{"role": "user", "content": prompt}],
    )
    parsed = _extract_json(msg.content[0].text.strip())
    ids = (parsed or {}).get("meeting_ids", []) if parsed else []

    by_id = {m.id: m for m in candidates}
    chosen = [by_id[i] for i in ids if i in by_id]
    if not chosen:
        chosen = candidates[:1]  # repli : la meilleure candidate
    return chosen[:MAX_DETAILED]


def answer_question(question: str, db: Session) -> dict:
    meetings = db.query(Meeting).filter(Meeting.summary.isnot(None)).all()
    if not meetings:
        return {
            "answer": "Aucune reunion analysee n'est encore disponible. "
                      "Importez et analysez une reunion pour que je puisse repondre.",
            "references": [],
        }

    # Étape 0 : pré-filtrage gratuit.
    candidates = _select_candidates(meetings, question)

    # Étape 1 : routeur léger -> 1 à 2 réunions à détailler.
    selected = _route(question, candidates)

    # Étape 2 : réponse ciblée sur le contenu détaillé.
    context = "\n\n".join(_meeting_detail(m) for m in selected)
    prompt = f"""Tu es un assistant intelligent specialise dans l'analyse de comptes
rendus de reunion. Tu reponds UNIQUEMENT a partir des reunions detaillees
ci-dessous. Tu raisonnes precisement : « la premiere recommandation » = element
n1 de la liste des recommandations ; « qui fait telle tache » = champ assigned_to,
etc. Ne fabrique jamais d'information absente. Si l'info n'y est pas, dis-le.

REUNIONS (contenu detaille) :
{context}

QUESTION :
{question}

Reponds UNIQUEMENT avec un JSON valide, sans texte ni backticks :
{{
  "answer": "reponse precise, claire, en francais, en designant les reunions par leur titre",
  "meeting_ids": [ids des reunions utilisees, ou []]
}}"""

    msg = client.messages.create(
        model=MODEL,
        max_tokens=1200,
        temperature=0,
        messages=[{"role": "user", "content": prompt}],
    )
    parsed = _extract_json(msg.content[0].text.strip())
    if not parsed:
        return {"answer": msg.content[0].text.strip(), "references": []}

    answer = parsed.get("answer", "").strip() or "Je n'ai pas trouve de reponse."
    ids = parsed.get("meeting_ids", []) or []

    by_id = {m.id: m for m in selected}
    references = [
        {
            "id": m.id,
            "title": m.title,
            "date": m.date.isoformat() if m.date else None,
        }
        for mid in ids if (m := by_id.get(mid))
    ]
    return {"answer": answer, "references": references}