"""Route Analytics : calcule des indicateurs réels à partir des réunions
stockées en base (aucune donnée fictive). Tout est agrégé côté serveur pour
que le frontend n'ait qu'à afficher.
"""

import json
from collections import Counter, defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.meeting import Meeting, MeetingStatus
from app.models.participant import Participant

router = APIRouter(prefix="/analytics", tags=["analytics"])

_MONTHS_FR = [
    "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
    "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc",
]


def _parse_json_list(value):
    if not value:
        return []
    if isinstance(value, list):
        return value
    try:
        parsed = json.loads(value)
        return parsed if isinstance(parsed, list) else []
    except Exception:
        return []


@router.get("/")
def get_analytics(db: Session = Depends(get_db)):
    # On ne compte que les réunions réellement analysées.
    meetings = (
        db.query(Meeting)
        .filter(Meeting.status == MeetingStatus.completed)
        .all()
    )

    total = len(meetings)

    # ── Cartes du haut ────────────────────────────────────────────
    durations = [m.duration for m in meetings if isinstance(m.duration, int)]
    avg_duration = round(sum(durations) / len(durations)) if durations else None

    confidences = [m.ai_confidence for m in meetings if isinstance(m.ai_confidence, int)]
    avg_confidence = round(sum(confidences) / len(confidences)) if confidences else None

    decisions_counts = [len(_parse_json_list(m.decisions)) for m in meetings]
    avg_decisions = (
        round(sum(decisions_counts) / len(decisions_counts), 1)
        if decisions_counts else 0
    )

    total_tasks = sum(len(_parse_json_list(m.tasks)) for m in meetings)

    # ── Tendances mensuelles (réunions / décisions / tâches) ──────
    monthly = defaultdict(lambda: {"meetings": 0, "decisions": 0, "tasks": 0})
    for m in meetings:
        if not m.date:
            continue
        key = (m.date.year, m.date.month)
        monthly[key]["meetings"] += 1
        monthly[key]["decisions"] += len(_parse_json_list(m.decisions))
        monthly[key]["tasks"] += len(_parse_json_list(m.tasks))

    monthly_trends = []
    for (year, month) in sorted(monthly.keys()):
        data = monthly[(year, month)]
        monthly_trends.append({
            "name": f"{_MONTHS_FR[month - 1]} {str(year)[2:]}",
            "meetings": data["meetings"],
            "decisions": data["decisions"],
            "tasks": data["tasks"],
        })

    # ── Top participants (par fréquence de présence) ──────────────
    meeting_ids = [m.id for m in meetings]
    participant_counter = Counter()
    if meeting_ids:
        participants = (
            db.query(Participant)
            .filter(Participant.meeting_id.in_(meeting_ids))
            .all()
        )
        for p in participants:
            if p.name and p.name.strip():
                participant_counter[p.name.strip()] += 1

    top_participants = [
        {"name": name, "count": count}
        for name, count in participant_counter.most_common(8)
    ]

    # ── Top présidents ────────────────────────────────────────────
    president_counter = Counter(
        m.president.strip() for m in meetings
        if m.president and m.president.strip()
    )
    top_presidents = [
        {"name": name, "count": count}
        for name, count in president_counter.most_common(6)
    ]

    # ── Répartition du sentiment ──────────────────────────────────
    sentiment_counter = Counter(
        (m.sentiment or "").strip().lower() for m in meetings
        if m.sentiment and m.sentiment.strip()
    )
    _sentiment_meta = {
        "positif": {"label": "Positif", "color": "#22c55e"},
        "neutre":  {"label": "Neutre",  "color": "#eab308"},
        "négatif": {"label": "Négatif", "color": "#ee3124"},
        "negatif": {"label": "Négatif", "color": "#ee3124"},
    }
    sentiment_dist = []
    _merged = Counter()
    for raw, cnt in sentiment_counter.items():
        meta = _sentiment_meta.get(raw)
        label = meta["label"] if meta else raw.capitalize()
        color = meta["color"] if meta else "#9ca3af"
        _merged[(label, color)] += cnt
    for (label, color), cnt in _merged.items():
        sentiment_dist.append({"name": label, "value": cnt, "color": color})

    return {
        "cards": {
            "total_meetings": total,
            "avg_duration": avg_duration,
            "avg_decisions": avg_decisions,
            "avg_confidence": avg_confidence,
            "total_tasks": total_tasks,
        },
        "monthly_trends": monthly_trends,
        "top_participants": top_participants,
        "top_presidents": top_presidents,
        "sentiment_distribution": sentiment_dist,
    }
