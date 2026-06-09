"""
Embedding Service Module for Omnisage Medical Record Aggregator.

This module provides functions to chunk medical record text into overlapping
segments, generate vector embeddings via Ollama, and store them in the
database for semantic search and RAG retrieval.
"""

import json
from sqlalchemy.orm import Session
from backend.config import settings
from backend.models import MedicalRecord
from backend.models.ai_models import RecordEmbedding
from backend.services.ollama_client import ollama_client


class EmbeddingService:
    """
    Service for generating and managing document embeddings.

    Chunks record text into overlapping segments and embeds each chunk
    using the configured Ollama embedding model.
    """

    @staticmethod
    def chunk_text(text: str, chunk_size: int = None, overlap: int = None) -> list[str]:
        """
        Splits text into overlapping chunks of approximately equal size.

        Args:
            text (str): The full text to split.
            chunk_size (int): Maximum characters per chunk (default from config).
            overlap (int): Number of overlapping characters between chunks.

        Returns:
            list[str]: List of text chunks.
        """
        if not text or not text.strip():
            return []

        chunk_size = chunk_size or settings.EMBEDDING_CHUNK_SIZE
        overlap = overlap or settings.EMBEDDING_CHUNK_OVERLAP

        # Clean up whitespace
        text = " ".join(text.split())

        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            if chunk.strip():
                chunks.append(chunk.strip())
            start = end - overlap

        return chunks

    @staticmethod
    def generate_embeddings_for_record(record_id: int, db: Session) -> int:
        """
        Generates and stores embeddings for all text chunks of a medical record.

        Deletes any existing embeddings for the record first (to support regeneration),
        then chunks the raw_text, embeds each chunk, and stores the results.

        Args:
            record_id (int): The medical record ID.
            db (Session): Active database session.

        Returns:
            int: Number of embedding chunks created.

        Raises:
            ValueError: If the record does not exist or has no text.
            RuntimeError: If Ollama embedding fails.
        """
        record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
        if not record:
            raise ValueError(f"Record {record_id} not found.")

        # Build the text to embed: combine structured data with raw text
        text_parts = []

        if record.file_name:
            text_parts.append(f"File: {record.file_name}")
        if record.category:
            text_parts.append(f"Category: {record.category}")
        if record.doctor:
            text_parts.append(f"Doctor: {record.doctor}")
        if record.record_date:
            text_parts.append(f"Date: {record.record_date}")
        if record.diagnoses:
            text_parts.append(f"Diagnoses: {', '.join(record.diagnoses)}")
        if record.medications:
            meds = [f"{m.get('name', '')} {m.get('dosage', '')}".strip() for m in record.medications]
            text_parts.append(f"Medications: {', '.join(meds)}")
        if record.vitals:
            vitals = [f"{v.get('metric', '')}: {v.get('value', '')} {v.get('unit', '')}".strip() for v in record.vitals]
            text_parts.append(f"Vitals: {', '.join(vitals)}")
        if record.raw_text:
            text_parts.append(record.raw_text)

        full_text = "\n".join(text_parts)

        if not full_text.strip():
            return 0

        # Delete existing embeddings for regeneration
        db.query(RecordEmbedding).filter(RecordEmbedding.record_id == record_id).delete()
        db.commit()

        # Chunk and embed
        chunks = EmbeddingService.chunk_text(full_text)
        if not chunks:
            return 0

        created = 0
        for i, chunk in enumerate(chunks):
            try:
                embedding_vector = ollama_client.embed(chunk)
                embedding_entry = RecordEmbedding(
                    record_id=record_id,
                    chunk_index=i,
                    chunk_text=chunk,
                    embedding=json.dumps(embedding_vector),
                )
                db.add(embedding_entry)
                created += 1
            except Exception as e:
                print(f"Warning: Failed to embed chunk {i} for record {record_id}: {e}")
                continue

        db.commit()
        return created

    @staticmethod
    def get_query_embedding(query: str) -> list[float]:
        """
        Generates an embedding vector for a search query.

        Args:
            query (str): The search query text.

        Returns:
            list[float]: The query embedding vector.
        """
        return ollama_client.embed(query)
