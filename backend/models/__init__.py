"""
Models Package Initializer.

This module makes the models directory a package and exports all SQLAlchemy
models: User, MedicalRecord, SharedLink, and AI-related models.
"""

from backend.models.user_models import User, SharedLink
from backend.models.record_models import MedicalRecord
from backend.models.ai_models import (
    RecordSummary,
    RecordEmbedding,
    ChatConversation,
    ChatMessage,
    HealthRecommendation,
)

__all__ = [
    "User", "SharedLink", "MedicalRecord",
    "RecordSummary", "RecordEmbedding",
    "ChatConversation", "ChatMessage",
    "HealthRecommendation",
]
