# app/models.py
from pydantic import BaseModel
from typing import Optional

class ChatMessage(BaseModel):
    message: str
    userId: Optional[str] = None

class ChatResponse(BaseModel):
    response: str