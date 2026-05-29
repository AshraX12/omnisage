"""
Pydantic Schemas Module for Omnisage Medical Record Aggregator.

This module defines Pydantic validation models for user authentication, record retrieval,
updating records, and generating shared links.
"""

from datetime import datetime, date
from typing import Optional, Any
from pydantic import BaseModel, EmailStr, Field


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
