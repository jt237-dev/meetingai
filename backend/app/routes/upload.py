import os
import shutil
import json
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.meeting import Meeting, MeetingStatus
from app.models.participant import Participant
from app.models.task import Task, TaskStatus
from app.services.file_service import extract_transcript
from app.services.ai_service import analyze_transcript
from datetime import datetime

router = APIRouter(prefix="/upload", tags=["upload"])

UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {".vtt", ".docx", ".txt", ".srt"}

@router.post("/")
async def upload_meeting_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Vérifier l'extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Format non supporté. Formats acceptés : {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Sauvegarder le fichier temporairement
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Extraire la transcription
        transcript = extract_transcript(file_path)

        if not transcript.strip():
            raise HTTPException(status_code=400, detail="Le fichier est vide ou illisible")

        # Analyser avec Claude AI
        analysis = analyze_transcript(transcript)

        # Parser la date
        meeting_date = datetime.now()
        if analysis.get("date"):
            try:
                meeting_date = datetime.fromisoformat(analysis["date"])
            except:
                pass

        # Créer la réunion en base
        db_meeting = Meeting(
            title=analysis.get("title", file.filename),
            date=meeting_date,
            duration=analysis.get("duration"),
            status=MeetingStatus.completed,
            summary=analysis.get("summary"),
            transcript=transcript,
            problematique=analysis.get("problematique"),
            objectifs=json.dumps(analysis.get("objectifs", []), ensure_ascii=False),
            solutions=json.dumps(analysis.get("solutions", []), ensure_ascii=False),
            consequences=json.dumps(analysis.get("consequences", []), ensure_ascii=False),
            decisions=json.dumps(analysis.get("decisions", []), ensure_ascii=False),
            tasks=json.dumps(analysis.get("tasks", []), ensure_ascii=False),
            ai_confidence=analysis.get("ai_confidence"),
            lieu=analysis.get("lieu"),
            heure_debut=analysis.get("heure_debut"),
            heure_fin=analysis.get("heure_fin"),
            president=analysis.get("president"),
            rapporteur=analysis.get("rapporteur"),
            ordre_du_jour=json.dumps(analysis.get("ordre_du_jour", []), ensure_ascii=False),
            activites_recommandations=json.dumps(analysis.get("activites_recommandations", []), ensure_ascii=False),
            resolutions=json.dumps(analysis.get("resolutions", []), ensure_ascii=False),
            points_veille=analysis.get("points_veille"),
            faits_saillants=analysis.get("faits_saillants"),
            divers=analysis.get("divers"),
            opportunites_apprendre=json.dumps(analysis.get("opportunites_apprendre", []), ensure_ascii=False),
            solde_tontine=analysis.get("solde_tontine"),
            rapporteurs_planification=json.dumps(analysis.get("rapporteurs_planification", []), ensure_ascii=False),
        )
        db.add(db_meeting)
        db.flush()

        # Ajouter les participants
        for p in analysis.get("participants", []):
            db_participant = Participant(
                name=p.get("name", "Inconnu"),
                role=p.get("role"),
                present=p.get("present", True),
                meeting_id=db_meeting.id
            )
            db.add(db_participant)

        # Ajouter les tâches
        for t in analysis.get("tasks", []):
            due_date = None
            if t.get("due_date"):
                try:
                    due_date = datetime.fromisoformat(t["due_date"])
                except:
                    pass
            db_task = Task(
                title=t.get("title", ""),
                assigned_to=t.get("assigned_to"),
                due_date=due_date,
                status=TaskStatus.todo,
                meeting_id=db_meeting.id
            )
            db.add(db_task)

        db.commit()
        db.refresh(db_meeting)

        return {
            "message": "Réunion analysée avec succès",
            "meeting_id": db_meeting.id,
            "title": db_meeting.title,
            "participants_count": len(analysis.get("participants", [])),
            "tasks_count": len(analysis.get("tasks", [])),
            "decisions_count": len(analysis.get("decisions", [])),
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'analyse : {str(e)}")
    finally:
        # Supprimer le fichier temporaire
        if os.path.exists(file_path):
            os.remove(file_path)


@router.post("/pending")
async def upload_meeting_pending(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Enregistre un fichier sans analyse IA — statut pending."""
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Format non supporté. Formats acceptés : {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Sauvegarder le fichier
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Extraire juste la transcription sans analyser
        transcript = extract_transcript(file_path)

        db_meeting = Meeting(
            title=file.filename.rsplit('.', 1)[0],  # nom du fichier sans extension
            date=datetime.now(),
            status=MeetingStatus.pending,
            transcript=transcript,
        )
        db.add(db_meeting)
        db.commit()
        db.refresh(db_meeting)

        return {
            "message": "Réunion enregistrée — analyse IA non effectuée",
            "meeting_id": db_meeting.id,
            "title": db_meeting.title,
            "status": "pending"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur : {str(e)}")
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)