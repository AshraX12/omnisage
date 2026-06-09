"""
AI Models Module for Omnisage Medical Record Aggregator.

This module defines SQLAlchemy ORM models for all AI-related database tables:
RecordSummary, RecordEmbedding, ChatConversation, ChatMessage, and
HealthRecommendation.
"""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime,
    ForeignKey, JSON, Date
)
from sqlalchemy.orm import relationship
from backend.database import Base


class RecordSummary(Base):
    """
    Stores AI-generated summaries for individual medical records.

    Each record has at most one summary. Summaries include structured
    sections: key findings, abnormal results, medications, and follow-ups.
    """
    __tablename__ = "record_summaries"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("medical_records.id", ondelete="CASCADE"), nullable=False, unique=True)
    summary_text = Column(Text, nullable=False)
    key_findings = Column(JSON, default=list)
    abnormal_results = Column(JSON, default=list)
    medications = Column(JSON, default=list)
    follow_ups = Column(JSON, default=list)
    model_used = Column(String(100), default="phi3:mini")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class RecordEmbedding(Base):
    """
    Stores vector embeddings for document text chunks.

    Each medical record is split into overlapping text chunks, and each chunk
    is embedded as a 768-dimensional vector for similarity search via pgvector.
    """
    __tablename__ = "record_embeddings"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("medical_records.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    chunk_text = Column(Text, nullable=False)
    # pgvector column — stored as a string in SQLAlchemy, queried via raw SQL
    # The actual VECTOR(768) type is created via raw DDL in database init
    embedding = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ChatConversation(Base):
    """
    Represents a RAG chatbot conversation session.

    Each conversation has a unique UUID identifier and contains multiple
    messages exchanged between the user and the AI assistant.
    """
    __tablename__ = "chat_conversations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), default="New Conversation")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan",
                            order_by="ChatMessage.created_at")


class ChatMessage(Base):
    """
    Stores individual messages within a chatbot conversation.

    Messages have a role (user or assistant) and optionally include
    citations pointing to source medical records used for RAG responses.
    """
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(String(36), ForeignKey("chat_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    citations = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("ChatConversation", back_populates="messages")


class HealthRecommendation(Base):
    """
    Stores AI-generated personalized health recommendations.

    Recommendations are categorized (lifestyle, exercise, diet, screening,
    followup) and include confidence scores and references to source records.
    """
    __tablename__ = "health_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    confidence = Column(Float, default=0.5)
    source_records = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    model_used = Column(String(100), default="phi3:mini")
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
