from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.meeting import Meeting
from app.models.participant import Participant
from app.models.task import Task
from app.services.pdf_service import generate_meeting_pdf
from app.services.pdf_service_elegant import generate_meeting_pdf_elegant
from app.services.pdf_service_modern import generate_meeting_pdf_modern
from app.services.docx_service import generate_meeting_docx
import json

router = APIRouter(prefix="/export", tags=["export"])

def parse_json_field(value):
    if not value: return []
    if isinstance(value, list): return value
    try: return json.loads(value)
    except: return []

def build_meeting_data(db_meeting, participants, tasks):
    return {
        "title":        db_meeting.title,
        "date":         db_meeting.date,
        "duration":     db_meeting.duration,
        "summary":      db_meeting.summary,
        "problematique": db_meeting.problematique or "",
        "objectifs":    parse_json_field(db_meeting.objectifs),
        "solutions":    parse_json_field(db_meeting.solutions),
        "consequences": parse_json_field(db_meeting.consequences),
        "decisions":    parse_json_field(db_meeting.decisions),
        "participants": [{"name": p.name, "role": p.role} for p in participants],
        "tasks": [
            {
                "title":       t.title,
                "assigned_to": t.assigned_to,
                "due_date":    t.due_date.isoformat() if t.due_date else None
            }
            for t in tasks
        ]
    }

@router.get("/meeting/{meeting_id}/pdf")
def export_meeting_pdf(
    meeting_id:    int,
    template:      str = "classic",
    company_name:  str = "Mon Entreprise",
    primary_color: str = "C41230",
    accent_color:  str = "FFCC00",
    dark_color:    str = "231F20",
    db: Session = Depends(get_db)
):
    db_meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not db_meeting:
        raise HTTPException(status_code=404, detail="Réunion introuvable")

    participants = db.query(Participant).filter(Participant.meeting_id == meeting_id).all()
    tasks        = db.query(Task).filter(Task.meeting_id == meeting_id).all()
    meeting_data = build_meeting_data(db_meeting, participants, tasks)

    primary_hex = f"#{primary_color.lstrip('#')}"
    accent_hex  = f"#{accent_color.lstrip('#')}"
    dark_hex    = f"#{dark_color.lstrip('#')}"

    if template == "elegant":
        pdf_bytes = generate_meeting_pdf_elegant(
            meeting=meeting_data,
            company_name=company_name,
            primary_color_hex=primary_hex,
            accent_color_hex=accent_hex,
            dark_color_hex=dark_hex,
        )
    elif template == "modern":
        pdf_bytes = generate_meeting_pdf_modern(
            meeting=meeting_data,
            company_name=company_name,
            primary_color_hex=primary_hex,
            accent_color_hex=accent_hex,
            dark_color_hex=dark_hex,
        )
    else:
        pdf_bytes = generate_meeting_pdf(
            meeting=meeting_data,
            company_name=company_name,
            primary_color_hex=primary_hex,
        )

    safe_title = db_meeting.title[:50].replace(" ", "_").replace("/", "-")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="CR_{safe_title}_{template}.pdf"'
        }
    )


@router.get("/meeting/{meeting_id}/docx")
def export_meeting_docx(
    meeting_id: int,
    db: Session = Depends(get_db)
):
    """
    Export du compte rendu au format .docx, reproduisant fidèlement le
    gabarit Word "COMPTE RENDU COMITE D'ETUDE" (logo, en-tête, page de garde,
    table des matières, tableaux récapitulatifs...).
    """
    db_meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not db_meeting:
        raise HTTPException(status_code=404, detail="Réunion introuvable")

    # db_meeting.participants est déjà disponible via la relation SQLAlchemy
    docx_buffer = generate_meeting_docx(db_meeting)

    safe_title = db_meeting.title[:50].replace(" ", "_").replace("/", "-")

    return Response(
        content=docx_buffer.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f'attachment; filename="CR_{safe_title}.docx"'
        }
    )