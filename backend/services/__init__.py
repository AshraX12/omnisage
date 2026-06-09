"""
Services Package Initializer.

This module makes the services directory a package and exports AI service classes.
"""

from backend.services.ollama_client import OllamaClient
from backend.services.summarization_service import SummarizationService
from backend.services.embedding_service import EmbeddingService
from backend.services.chat_service import ChatService
from backend.services.recommendation_service import RecommendationService
from backend.services.search_service import SearchService

__all__ = [
    "OllamaClient",
    "SummarizationService",
    "EmbeddingService",
    "ChatService",
    "RecommendationService",
    "SearchService",
]
