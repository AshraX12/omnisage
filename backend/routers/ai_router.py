"""
AI Router Module for Omnisage Medical Record Aggregator.

This module exposes all AI-powered FastAPI endpoints: medical report
summarization, RAG chatbot, health recommendations, and semantic search.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.ai_models import ChatConversation, ChatMessage, HealthRecommendation
from backend.models.schemas import (
    SummaryResponse,
    ChatRequest, ChatResponse,
    ConversationListItem, ConversationDetail, ChatMessageSchema,
    RecommendationResponse,
    SemanticSearchRequest, SemanticSearchResult,
)
from backend.services.summarization_service import SummarizationService
from backend.services.chat_service import ChatService
from backend.services.recommendation_service import RecommendationService
from backend.services.search_service import SearchService
from backend.services.embedding_service import EmbeddingService

# Initialize APIRouter
router = APIRouter(
    prefix="/api/ai",
    tags=["AI Features"]
)


# ── Summarization Endpoints ─────────────────────────────────────────────

@router.post("/summarize/{record_id}", response_model=SummaryResponse)
def generate_summary(
    record_id: int,
    db: Session = Depends(get_db)
) -> SummaryResponse:
    """
    Generates or regenerates an AI summary for a medical record.

    Args:
        record_id (int): The medical record ID to summarize.
        db (Session): Active database session.

    Returns:
        SummaryResponse: The generated summary with structured sections.

    Raises:
        HTTPException: If the record is not found or summarization fails.
    """
    try:
        summary = SummarizationService.generate_summary(record_id, db)
        return summary
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")


@router.get("/summary/{record_id}", response_model=SummaryResponse)
def get_summary(
    record_id: int,
    db: Session = Depends(get_db)
) -> SummaryResponse:
    """
    Retrieves an existing AI summary for a medical record.

    Args:
        record_id (int): The medical record ID.
        db (Session): Active database session.

    Returns:
        SummaryResponse: The existing summary.

    Raises:
        HTTPException: If no summary exists for this record.
    """
    summary = SummarizationService.get_summary(record_id, db)
    if not summary:
        raise HTTPException(status_code=404, detail="No summary exists for this record.")
    return summary


# ── Chat/RAG Endpoints ──────────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
def send_chat_message(
    request: ChatRequest,
    db: Session = Depends(get_db)
) -> ChatResponse:
    """
    Sends a message to the AI chatbot and receives a RAG-powered response.

    If conversation_id is None, creates a new conversation. The response
    includes citations pointing to source medical records.

    Args:
        request (ChatRequest): The chat message payload.
        db (Session): Active database session.

    Returns:
        ChatResponse: The assistant's reply with conversation ID and citations.
    """
    try:
        result = ChatService.send_message(
            message=request.message,
            conversation_id=request.conversation_id,
            db=db,
            user_id=1,  # Default user for prototype
        )
        return ChatResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


@router.get("/chat/conversations", response_model=list[ConversationListItem])
def list_conversations(
    db: Session = Depends(get_db)
) -> list[ConversationListItem]:
    """
    Lists all chat conversations for the current user, newest first.

    Args:
        db (Session): Active database session.

    Returns:
        list[ConversationListItem]: List of conversation summaries.
    """
    conversations = (
        db.query(ChatConversation)
        .filter(ChatConversation.user_id == 1)
        .order_by(ChatConversation.updated_at.desc())
        .all()
    )
    return conversations


@router.get("/chat/conversations/{conversation_id}", response_model=ConversationDetail)
def get_conversation(
    conversation_id: str,
    db: Session = Depends(get_db)
) -> ConversationDetail:
    """
    Retrieves a full conversation with all messages and citations.

    Args:
        conversation_id (str): The conversation UUID.
        db (Session): Active database session.

    Returns:
        ConversationDetail: Full conversation with message history.
    """
    conversation = (
        db.query(ChatConversation)
        .filter(
            ChatConversation.id == conversation_id,
            ChatConversation.user_id == 1,
        )
        .first()
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return conversation


@router.delete("/chat/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    db: Session = Depends(get_db)
) -> dict:
    """
    Deletes a conversation and all its messages.

    Args:
        conversation_id (str): The conversation UUID.
        db (Session): Active database session.

    Returns:
        dict: Success confirmation message.
    """
    conversation = (
        db.query(ChatConversation)
        .filter(
            ChatConversation.id == conversation_id,
            ChatConversation.user_id == 1,
        )
        .first()
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    db.delete(conversation)
    db.commit()
    return {"message": "Conversation deleted."}


# ── Recommendations Endpoints ───────────────────────────────────────────

@router.get("/recommendations", response_model=list[RecommendationResponse])
def get_recommendations(
    db: Session = Depends(get_db)
) -> list[RecommendationResponse]:
    """
    Retrieves all active health recommendations for the current user.

    Args:
        db (Session): Active database session.

    Returns:
        list[RecommendationResponse]: Active personalized recommendations.
    """
    recs = RecommendationService.get_active_recommendations(user_id=1, db=db)
    return recs


@router.post("/recommendations/generate", response_model=list[RecommendationResponse])
def regenerate_recommendations(
    db: Session = Depends(get_db)
) -> list[RecommendationResponse]:
    """
    Forces regeneration of health recommendations based on current records.

    Args:
        db (Session): Active database session.

    Returns:
        list[RecommendationResponse]: Newly generated recommendations.
    """
    try:
        recs = RecommendationService.generate_recommendations(user_id=1, db=db)
        return recs
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation generation failed: {str(e)}")


# ── Semantic Search Endpoint ────────────────────────────────────────────

@router.post("/search", response_model=list[SemanticSearchResult])
def semantic_search(
    request: SemanticSearchRequest,
    db: Session = Depends(get_db)
) -> list[SemanticSearchResult]:
    """
    Performs semantic search across all medical records.

    Embeds the query, computes vector similarity against stored embeddings,
    and returns ranked results with optional date/category/doctor filters.

    Args:
        request (SemanticSearchRequest): The search query and filters.
        db (Session): Active database session.

    Returns:
        list[SemanticSearchResult]: Ranked search results with excerpts.
    """
    try:
        results = SearchService.semantic_search(
            query=request.query,
            db=db,
            user_id=1,
            date_from=request.date_from,
            date_to=request.date_to,
            category=request.category,
            doctor=request.doctor,
        )
        return results
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")
