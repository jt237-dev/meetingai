from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.meeting import Meeting
from app.models.participant import Participant
from app.schemas.meeting import MeetingCreate, MeetingUpdate, MeetingOut

router = APIRouter(prefix="/meetings", tags=["meetings"])

@router.get("/", response_model=None)
def get_meetings(db: Session = Depends(get_db)):
    meetings = db.query(Meeting).order_by(Meeting.created_at.desc()).all()
    return [
        {
            "id": m.id,
            "title": m.title,
            "date": m.date,
            "duration": m.duration,
            "status": m.status,
            "summary": m.summary,
            "ai_confidence": m.ai_confidence,
            "created_at": m.created_at,
            "participants": [
                {"name": p.name, "role": p.role}
                for p in m.participants
            ],
        }
        for m in meetings
    ]

@router.get("/{meeting_id}", response_model=None)
def get_meeting(meeting_id: int, db: Session = Depends(get_db)):
    from app.models.task import Task
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Réunion introuvable")
    
    tasks = db.query(Task).filter(Task.meeting_id == meeting_id).all()
    
    return {
        "id": meeting.id,
        "title": meeting.title,
        "date": meeting.date,
        "duration": meeting.duration,
        "status": meeting.status,
        "summary": meeting.summary,
        "ai_confidence": meeting.ai_confidence,
        "transcript": meeting.transcript,
        "problematique": meeting.problematique,
        "objectifs": meeting.objectifs,
        "solutions": meeting.solutions,
        "consequences": meeting.consequences,
        "decisions": meeting.decisions,
        "created_at": meeting.created_at,
        "participants": [
            {"name": p.name, "role": p.role}
            for p in meeting.participants
        ],
        "tasks": [
            {
                "id": t.id,
                "title": t.title,
                "assigned_to": t.assigned_to,
                "due_date": t.due_date,
                "status": t.status,
            }
            for t in tasks
        ]
    }

@router.post("/", response_model=MeetingOut)
def create_meeting(meeting: MeetingCreate, db: Session = Depends(get_db)):
    db_meeting = Meeting(
        title=meeting.title,
        date=meeting.date,
        duration=meeting.duration,
    )
    db.add(db_meeting)
    db.flush()

    for p in meeting.participants:
        db_participant = Participant(
            name=p.name,
            email=p.email,
            role=p.role,
            meeting_id=db_meeting.id
        )
        db.add(db_participant)

    db.commit()
    db.refresh(db_meeting)
    return db_meeting

@router.put("/{meeting_id}", response_model=MeetingOut)
def update_meeting(meeting_id: int, meeting: MeetingUpdate, db: Session = Depends(get_db)):
    db_meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not db_meeting:
        raise HTTPException(status_code=404, detail="Réunion introuvable")
    for key, value in meeting.model_dump(exclude_unset=True).items():
        setattr(db_meeting, key, value)
    db.commit()
    db.refresh(db_meeting)
    return db_meeting

@router.delete("/{meeting_id}")
def delete_meeting(meeting_id: int, db: Session = Depends(get_db)):
    db_meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not db_meeting:
        raise HTTPException(status_code=404, detail="Réunion introuvable")
    db.delete(db_meeting)
    db.commit()
    return {"message": "Réunion supprimée"}