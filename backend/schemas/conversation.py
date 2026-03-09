from pydantic import BaseModel, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid


def _validate_uuid(v: str | None) -> str | None:
    if v is None or v == "":
        return v
    try:
        uuid.UUID(str(v))
        return v
    except (ValueError, TypeError):
        raise ValueError("conversation_id must be a valid UUID")


class Message(BaseModel):
    role: str  # "user" | "assistant" | "system"
    content: str
    timestamp: str = datetime.utcnow().isoformat()
    agent: Optional[str] = None


class ConversationState(BaseModel):
    conversation_id: str
    messages: List[Message] = []
    context: Dict[str, Any] = {}
    status: str = "awaiting_input"
    # statuses: awaiting_input | clarifying | processing | complete | guardrail_triggered
    turn_count: int = 0
    detected_sector: Optional[str] = None
    detected_role: Optional[str] = None
    pipeline_events: List[Dict[str, Any]] = []


class QueryRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    context: Dict[str, Any] = {}

    @field_validator("message")
    @classmethod
    def message_non_empty_and_bounded(cls, v: str) -> str:
        v = (v or "").strip()
        if not v:
            raise ValueError("Query must be non-empty")
        if len(v) > 2000:
            raise ValueError("Query must be under 2000 characters")
        return v

    @field_validator("conversation_id")
    @classmethod
    def conversation_id_valid_uuid(cls, v: str | None) -> str | None:
        return _validate_uuid(v)


class QueryResponse(BaseModel):
    conversation_id: str
    status: str  # "clarifying" | "complete" | "guardrail_triggered"
    clarifying_questions: Optional[List[Dict]] = None
    result: Optional[Dict] = None
    guardrail_message: Optional[str] = None
    guardrail_type: Optional[str] = None
