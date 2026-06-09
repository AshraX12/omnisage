"""
Search Service Module for Omnisage Medical Record Aggregator.

This module implements semantic search across all medical records using
vector similarity. Supports natural language queries with optional filters
for date range, category, and physician.
"""

import json
from datetime import date
from sqlalchemy.orm import Session
from backend.config import settings
from backend.models import MedicalRecord
from backend.models.ai_models import RecordEmbedding
from backend.services.ollama_client import ollama_client


class SearchService:
    """
    Semantic search service for finding relevant medical records
    using embedding-based vector similarity.
    """

    @staticmethod
    def _cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
        """
        Computes cosine similarity between two vectors.

        Args:
            vec_a (list[float]): First vector.
            vec_b (list[float]): Second vector.

        Returns:
            float: Cosine similarity score.
        """
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 0.0

        dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
        norm_a = sum(a * a for a in vec_a) ** 0.5
        norm_b = sum(b * b for b in vec_b) ** 0.5

        if norm_a == 0 or norm_b == 0:
            return 0.0

        return dot_product / (norm_a * norm_b)

    @staticmethod
    def semantic_search(
        query: str,
        db: Session,
        user_id: int = 1,
        date_from: date = None,
        date_to: date = None,
        category: str = None,
        doctor: str = None,
        top_k: int = 10,
    ) -> list[dict]:
        """
        Performs semantic search across all embedded medical records.

        Embeds the query, retrieves all embeddings for the user's records
        (with optional filters), computes cosine similarity, and returns
        ranked results with matching text excerpts.

        Args:
            query (str): Natural language search query.
            db (Session): Active database session.
            user_id (int): The user ID to filter records.
            date_from (date): Optional start date filter.
            date_to (date): Optional end date filter.
            category (str): Optional category filter.
            doctor (str): Optional physician name filter.
            top_k (int): Maximum number of results to return.

        Returns:
            list[dict]: Ranked search results with keys: record_id,
                file_name, category, record_date, similarity_score, chunk_text.
        """
        # Embed the query
        query_embedding = ollama_client.embed(query)

        # Build the base query
        base_query = (
            db.query(RecordEmbedding, MedicalRecord)
            .join(MedicalRecord, RecordEmbedding.record_id == MedicalRecord.id)
            .filter(MedicalRecord.user_id == user_id)
        )

        # Apply optional filters
        if date_from:
            base_query = base_query.filter(MedicalRecord.record_date >= date_from)
        if date_to:
            base_query = base_query.filter(MedicalRecord.record_date <= date_to)
        if category and category.strip():
            base_query = base_query.filter(MedicalRecord.category == category)
        if doctor and doctor.strip():
            base_query = base_query.filter(MedicalRecord.doctor.ilike(f"%{doctor}%"))

        all_embeddings = base_query.all()

        if not all_embeddings:
            return []

        # Compute similarities
        results = []
        seen_records = {}

        for emb, record in all_embeddings:
            try:
                stored_embedding = json.loads(emb.embedding) if isinstance(emb.embedding, str) else emb.embedding
                score = SearchService._cosine_similarity(query_embedding, stored_embedding)

                # Keep only the best-scoring chunk per record
                if record.id in seen_records:
                    if score > seen_records[record.id]["similarity_score"]:
                        seen_records[record.id] = {
                            "record_id": record.id,
                            "file_name": record.file_name,
                            "category": record.category,
                            "record_date": str(record.record_date) if record.record_date else None,
                            "similarity_score": round(score, 4),
                            "chunk_text": emb.chunk_text,
                        }
                else:
                    seen_records[record.id] = {
                        "record_id": record.id,
                        "file_name": record.file_name,
                        "category": record.category,
                        "record_date": str(record.record_date) if record.record_date else None,
                        "similarity_score": round(score, 4),
                        "chunk_text": emb.chunk_text,
                    }
            except Exception:
                continue

        results = list(seen_records.values())
        results.sort(key=lambda x: x["similarity_score"], reverse=True)

        # Filter out very low scores
        results = [r for r in results if r["similarity_score"] > 0.2]

        return results[:top_k]
