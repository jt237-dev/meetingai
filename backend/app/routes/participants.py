from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.participant import Participant
from app.models.meeting import Meeting

router = APIRouter(prefix="/participants", tags=["participants"])


def _serialize(p: Participant, meeting: Meeting | None = None):
    return {
        "id": p.id,
        "name": p.name,
        "email": p.email,
        "role": p.role,
        "present": p.present,
        "meeting_id": p.meeting_id,
        "meeting_title": meeting.title if meeting else None,
        "meeting_date": meeting.date if meeting else None,
    }


@router.get("/")
def get_all_participants(db: Session = Depends(get_db)):
    """
    Liste tous les participants, toutes réunions confondues, avec le
    contexte de leur réunion (titre, date). Sert de base à la recherche et
    au regroupement par réunion côté frontend.
    """
    participants = db.query(Participant).all()
    result = []
    for p in participants:
        meeting = db.query(Meeting).filter(Meeting.id == p.meeting_id).first()
        result.append(_serialize(p, meeting))
    return result


@router.get("/meeting/{meeting_id}")
def get_participants_for_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Réunion introuvable")
    return [_serialize(p, meeting) for p in meeting.participants]


@router.post("/meeting/{meeting_id}")
def add_participant(meeting_id: int, body: dict, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Réunion introuvable")

    name = (body.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=422, detail="Le nom est requis")

    participant = Participant(
        name=name,
        email=body.get("email"),
        role=body.get("role"),
        present=body.get("present", True),
        meeting_id=meeting_id,
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return _serialize(participant, meeting)


@router.put("/{participant_id}")
def update_participant(participant_id: int, body: dict, db: Session = Depends(get_db)):
    participant = db.query(Participant).filter(Participant.id == participant_id).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant introuvable")

    for field in ("name", "email", "role", "present"):
        if field in body:
            setattr(participant, field, body[field])

    db.commit()
    db.refresh(participant)
    meeting = db.query(Meeting).filter(Meeting.id == participant.meeting_id).first()
    return _serialize(participant, meeting)


@router.delete("/{participant_id}")
def delete_participant(participant_id: int, db: Session = Depends(get_db)):
    participant = db.query(Participant).filter(Participant.id == participant_id).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant introuvable")
    db.delete(participant)
    db.commit()
    return {"message": "Participant supprimé"}