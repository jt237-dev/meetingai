from sqlalchemy import Boolean, Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    role = Column(String(100), nullable=True)
    present = Column(Boolean, nullable=False, default=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)

    meeting = relationship("Meeting", back_populates="participants")