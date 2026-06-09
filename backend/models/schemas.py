"""
Pydantic Schemas Module for Omnisage Medical Record Aggregator.

This module defines Pydantic validation models for user authentication, record retrieval,
updating records, generating shared links, and all AI feature request/response payloads.
"""

from datetime import datetime, date
from typing import Optional, Any
from pydantic import BaseModel, EmailStr, Field


# ── Existing Schemas ────────────────────────────────────────────────────

class UserCreate(BaseModel):
    """
    Validation schema for creating a new user account.
    """
    email: EmailStr
    full_name: str
    password: str


class UserResponse(BaseModel):
    """
    Serialization schema for user account detail responses.
    """
    id: int
    email: str
    full_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MedicalRecordResponse(BaseModel):
    """
    Serialization schema for medical record list and details.
    """
    id: int
    user_id: int
    file_name: str
    file_type: str
    category: str
    record_date: Optional[date] = None
    doctor: Optional[str] = None
    diagnoses: list[str] = []
    medications: list[dict[str, Any]] = []
    vitals: list[dict[str, Any]] = []
    dicom_metadata: Optional[dict[str, Any]] = None
    is_reviewed: bool
    uploaded_at: datetime

    class Config:
        from_attributes = True


class MedicalRecordUpdate(BaseModel):
    """
    Validation schema for updating record details after human review.
    """
    category: Optional[str] = None
    record_date: Optional[date] = None
    doctor: Optional[str] = None
    diagnoses: Optional[list[str]] = None
    medications: Optional[list[dict[str, Any]]] = None
    vitals: Optional[list[dict[str, Any]]] = None
    is_reviewed: Optional[bool] = None


class SharedLinkCreate(BaseModel):
    """
    Validation schema for creating an expiring sharing link.
    """
    record_ids: list[int]
    expiry_hours: int = Field(default=24, ge=1, le=168)  # Min 1 hour, max 1 week
    passcode: Optional[str] = None


class SharedLinkResponse(BaseModel):
    """
    Serialization schema for sharing link metadata responses.
    """
    id: str
    creator_id: int
    record_ids: list[int]
    expiry_time: datetime
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── AI Feature Schemas ──────────────────────────────────────────────────

class SummaryResponse(BaseModel):
    """
    Serialization schema for an AI-generated medical record summary.
    """
    id: int
    record_id: int
    summary_text: str
    key_findings: list[str] = []
    abnormal_results: list[dict[str, Any]] = []
    medications: list[dict[str, Any]] = []
    follow_ups: list[str] = []
    model_used: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    """
    Validation schema for sending a message to the AI chatbot.

    If conversation_id is None, a new conversation is created.
    """
    conversation_id: Optional[str] = None
    message: str = Field(..., min_length=1, max_length=2000)


class ChatMessageSchema(BaseModel):
    """
    Serialization schema for a single chat message.
    """
    id: int
    role: str
    content: str
    citations: list[dict[str, Any]] = []
    created_at: datetime

    class Config:
        from_attributes = True


class ChatResponse(BaseModel):
    """
    Response schema for the AI chat endpoint.

    Returns the assistant's reply along with the conversation ID
    and any document citations used to generate the response.
    """
    conversation_id: str
    message: str
    citations: list[dict[str, Any]] = []


class ConversationListItem(BaseModel):
    """
    Serialization schema for listing conversations in the sidebar.
    """
    id: str
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConversationDetail(BaseModel):
    """
    Full conversation with all messages.
    """
    id: str
    title: str
    messages: list[ChatMessageSchema] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RecommendationResponse(BaseModel):
    """
    Serialization schema for a personalized health recommendation.
    """
    id: int
    category: str
    title: str
    description: str
    confidence: float
    source_records: list[int] = []
    model_used: str
    created_at: datetime

    class Config:
        from_attributes = True


class SemanticSearchRequest(BaseModel):
    """
    Validation schema for semantic search queries.
    """
    query: str = Field(..., min_length=1, max_length=500)
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    category: Optional[str] = None
    doctor: Optional[str] = None


class SemanticSearchResult(BaseModel):
    """
    Serialization schema for a single semantic search result.
    """
    record_id: int
    file_name: str
    category: str
    record_date: Optional[date] = None
    similarity_score: float
    chunk_text: str
