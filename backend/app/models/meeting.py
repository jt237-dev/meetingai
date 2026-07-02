from sqlalchemy import Column, Integer, String, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class MeetingStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    date = Column(DateTime, nullable=False)
    duration = Column(Integer)
    status = Column(Enum(MeetingStatus), default=MeetingStatus.pending)
    summary = Column(Text, nullable=True)
    transcript = Column(Text, nullable=True)
    audio_file_path = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    ai_confidence = Column(Integer, nullable=True)

    # Nouvelles sections structurées
    problematique = Column(Text, nullable=True)
    objectifs = Column(Text, nullable=True)    # JSON
    solutions = Column(Text, nullable=True)    # JSON
    consequences = Column(Text, nullable=True) # JSON
    decisions = Column(Text, nullable=True)    # JSON
    tasks = Column(Text, nullable=True)        # JSON

    participants = relationship("Participant", back_populates="meeting", cascade="all, delete")

    # --- Sections ajoutées pour l'export .docx fidèle au compte rendu Word ---
    lieu = Column(String(255), nullable=True)
    heure_debut = Column(String(20), nullable=True)
    heure_fin = Column(String(20), nullable=True)
    president = Column(String(255), nullable=True)
    rapporteur = Column(String(255), nullable=True)

    ordre_du_jour = Column(Text, nullable=True)             # JSON: liste de points
    activites_recommandations = Column(Text, nullable=True)  # JSON: tableau récapitulatif
    resolutions = Column(Text, nullable=True)               # JSON: liste de résolutions
    points_veille = Column(Text, nullable=True)             # texte libre
    faits_saillants = Column(Text, nullable=True)           # texte libre
    divers = Column(Text, nullable=True)                    # texte libre
    opportunites_apprendre = Column(Text, nullable=True)    # JSON: liste
    solde_tontine = Column(String(100), nullable=True)
    rapporteurs_planification = Column(Text, nullable=True)  # JSON: liste
    # Sentiment global de la réunion, extrait par l'IA lors de l'analyse.
    # "positif" | "neutre" | "négatif" (label lisible) + score 0-100 (optionnel).
    sentiment = Column(String(20), nullable=True)
    sentiment_score = Column(Integer, nullable=True)


    