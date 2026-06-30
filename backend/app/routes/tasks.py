from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.task import Task
from app.models.meeting import Meeting
import json

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.get("/")
def get_all_tasks(db: Session = Depends(get_db)):
    tasks = db.query(Task).order_by(Task.created_at.desc()).all()
    result = []
    for t in tasks:
        meeting = db.query(Meeting).filter(Meeting.id == t.meeting_id).first()
        result.append({
            "id": t.id,
            "title": t.title,
            "assigned_to": t.assigned_to,
            "due_date": t.due_date,
            "status": t.status,
            "meeting_id": t.meeting_id,
            "meeting_title": meeting.title if meeting else "Réunion inconnue",
        })
    return result

@router.patch("/{task_id}/status")
def update_task_status(task_id: int, body: dict, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Tâche introuvable")
    task.status = body.get("status", task.status)
    db.commit()
    db.refresh(task)
    return {"id": task.id, "status": task.status}

@router.get("/decisions")
def get_all_decisions(db: Session = Depends(get_db)):
    meetings = db.query(Meeting).filter(
        Meeting.decisions.isnot(None),
        Meeting.status == "completed"
    ).all()
    result = []
    for m in meetings:
        try:
            decisions = json.loads(m.decisions)
            for i, d in enumerate(decisions):
                result.append({
                    "id": f"{m.id}-{i}",
                    "decision": d,
                    "meeting_id": m.id,
                    "meeting_title": m.title,
                    "date": m.date,
                })
        except:
            pass
    return result