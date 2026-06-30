from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.models.meeting import MeetingStatus

class ParticipantBase(BaseModel):
    name: str
    email: Optional[str] = None
    role: Optional[str] = None
    present: Optional[bool] = True

class ParticipantCreate(ParticipantBase):
    pass

class ParticipantOut(ParticipantBase):
    id: int
    meeting_id: int

    class Config:
        from_attributes = True

class MeetingBase(BaseModel):
    title: str
    date: datetime
    duration: Optional[int] = None

class MeetingCreate(MeetingBase):
    participants: Optional[List[ParticipantCreate]] = []

class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[datetime] = None
    duration: Optional[int] = None
    status: Optional[MeetingStatus] = None
    summary: Optional[str] = None
    transcript: Optional[str] = None

    lieu: Optional[str] = None
    heure_debut: Optional[str] = None
    heure_fin: Optional[str] = None
    president: Optional[str] = None
    rapporteur: Optional[str] = None

    ordre_du_jour: Optional[str] = None
    activites_recommandations: Optional[str] = None
    resolutions: Optional[str] = None
    points_veille: Optional[str] = None
    faits_saillants: Optional[str] = None
    divers: Optional[str] = None
    opportunites_apprendre: Optional[str] = None
    solde_tontine: Optional[str] = None
    rapporteurs_planification: Optional[str] = None

class MeetingOut(MeetingBase):
    id: int
    status: MeetingStatus
    summary: Optional[str] = None
    transcript: Optional[str] = None
    created_at: datetime
    participants: List[ParticipantOut] = []

    lieu: Optional[str] = None
    heure_debut: Optional[str] = None
    heure_fin: Optional[str] = None
    president: Optional[str] = None
    rapporteur: Optional[str] = None

    ordre_du_jour: Optional[str] = None
    activites_recommandations: Optional[str] = None
    resolutions: Optional[str] = None
    points_veille: Optional[str] = None
    faits_saillants: Optional[str] = None
    divers: Optional[str] = None
    opportunites_apprendre: Optional[str] = None
    solde_tontine: Optional[str] = None
    rapporteurs_planification: Optional[str] = None

    class Config:
        from_attributes = True