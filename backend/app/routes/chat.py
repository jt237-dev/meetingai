from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.chat_service import answer_question

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    question: str


class MeetingReference(BaseModel):
    id: int
    title: str
    date: str | None = None


class ChatResponse(BaseModel):
    answer: str
    references: list[MeetingReference]


@router.post("/", response_model=ChatResponse)
def chat(payload: ChatRequest, db: Session = Depends(get_db)):
    question = (payload.question or "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="La question est vide.")

    result = answer_question(question, db)
    return result
