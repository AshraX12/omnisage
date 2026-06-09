"""
Summarization Service Module for Omnisage Medical Record Aggregator.

This module generates AI-powered structured summaries of medical records using
the configured Ollama LLM. Summaries are broken into key findings, abnormal
results, medications, and recommended follow-ups.
"""

import json
import re
from datetime import datetime
from sqlalchemy.orm import Session
from backend.models import MedicalRecord
from backend.models.ai_models import RecordSummary
from backend.services.ollama_client import ollama_client


SUMMARIZATION_SYSTEM_PROMPT = """You are a medical document summarization assistant. You analyze medical records and generate structured, patient-friendly summaries.

You MUST respond in valid JSON format with these exact keys:
{
  "summary_text": "A brief 2-3 sentence overview of the document.",
  "key_findings": ["finding 1", "finding 2", ...],
  "abnormal_results": [{"metric": "name", "value": "value with unit", "status": "High/Low/Critical"}],
  "medications": [{"name": "drug name", "dosage": "dosage", "frequency": "frequency"}],
  "follow_ups": ["recommendation 1", "recommendation 2", ...]
}

Rules:
- Use simple, patient-friendly language
- If a section has no data, use an empty array []
- For abnormal_results, only include values that are outside normal range
- Be concise but thorough
- Always return valid JSON"""


class SummarizationService:
    """
    Service for generating and managing AI-powered medical record summaries.
    """

    @staticmethod
    def build_record_prompt(record: MedicalRecord) -> str:
        """
        Constructs a structured prompt from a medical record's extracted data.

        Args:
            record (MedicalRecord): The record to summarize.

        Returns:
            str: A formatted prompt string for the LLM.
        """
        parts = [f"Medical Record: {record.file_name}"]
        parts.append(f"Category: {record.category}")

        if record.record_date:
            parts.append(f"Date: {record.record_date}")
        if record.doctor:
            parts.append(f"Physician: {record.doctor}")

        if record.diagnoses:
            parts.append(f"Diagnoses: {', '.join(record.diagnoses)}")

        if record.medications:
            med_lines = []
            for m in record.medications:
                line = m.get("name", "Unknown")
                if m.get("dosage"):
                    line += f" {m['dosage']}"
                if m.get("frequency"):
                    line += f" ({m['frequency']})"
                med_lines.append(line)
            parts.append(f"Medications: {'; '.join(med_lines)}")

        if record.vitals:
            vital_lines = []
            for v in record.vitals:
                line = f"{v.get('metric', '?')}: {v.get('value', '?')} {v.get('unit', '')}"
                if v.get("status"):
                    line += f" [{v['status']}]"
                vital_lines.append(line)
            parts.append(f"Vitals/Lab Results:\n" + "\n".join(vital_lines))

        if record.raw_text:
            # Truncate raw text to prevent exceeding context window
            truncated = record.raw_text[:3000]
            parts.append(f"\nFull Document Text:\n{truncated}")

        return "\n".join(parts)

    @staticmethod
    def parse_llm_response(response_text: str) -> dict:
        """
        Parses the LLM's JSON response, with fallback for malformed output.

        Args:
            response_text (str): Raw LLM output string.

        Returns:
            dict: Parsed summary with keys: summary_text, key_findings,
                  abnormal_results, medications, follow_ups.
        """
        # Try to extract JSON from the response
        try:
            # Look for JSON block in response
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                data = json.loads(json_match.group())
                return {
                    "summary_text": data.get("summary_text", response_text[:500]),
                    "key_findings": data.get("key_findings", []),
                    "abnormal_results": data.get("abnormal_results", []),
                    "medications": data.get("medications", []),
                    "follow_ups": data.get("follow_ups", []),
                }
        except (json.JSONDecodeError, AttributeError):
            pass

        # Fallback: use the raw text as summary
        return {
            "summary_text": response_text[:1000],
            "key_findings": [],
            "abnormal_results": [],
            "medications": [],
            "follow_ups": [],
        }

    @staticmethod
    def generate_summary(record_id: int, db: Session) -> RecordSummary:
        """
        Generates an AI summary for a medical record and stores it in the database.

        If a summary already exists, it is deleted and regenerated.

        Args:
            record_id (int): The medical record ID.
            db (Session): Active database session.

        Returns:
            RecordSummary: The created or updated summary record.

        Raises:
            ValueError: If the record does not exist.
            RuntimeError: If Ollama generation fails.
        """
        record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
        if not record:
            raise ValueError(f"Record {record_id} not found.")

        # Build the prompt
        prompt = SummarizationService.build_record_prompt(record)

        # Call Ollama
        response_text = ollama_client.generate(
            prompt=f"Summarize this medical record:\n\n{prompt}",
            system=SUMMARIZATION_SYSTEM_PROMPT,
            temperature=0.2,
        )

        # Parse the response
        parsed = SummarizationService.parse_llm_response(response_text)

        # Delete existing summary if regenerating
        existing = db.query(RecordSummary).filter(RecordSummary.record_id == record_id).first()
        if existing:
            db.delete(existing)
            db.commit()

        # Create new summary
        summary = RecordSummary(
            record_id=record_id,
            summary_text=parsed["summary_text"],
            key_findings=parsed["key_findings"],
            abnormal_results=parsed["abnormal_results"],
            medications=parsed["medications"],
            follow_ups=parsed["follow_ups"],
            model_used=ollama_client.model,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(summary)
        db.commit()
        db.refresh(summary)
        return summary

    @staticmethod
    def get_summary(record_id: int, db: Session) -> RecordSummary:
        """
        Retrieves an existing summary for a medical record.

        Args:
            record_id (int): The medical record ID.
            db (Session): Active database session.

        Returns:
            RecordSummary or None: The existing summary, or None if not found.
        """
        return db.query(RecordSummary).filter(RecordSummary.record_id == record_id).first()
