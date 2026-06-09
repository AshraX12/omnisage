"""
Recommendation Service Module for Omnisage Medical Record Aggregator.

This module generates personalized health recommendations by analyzing
the user's complete medical history, biometrics trends, diagnoses, and
medications via the configured Ollama LLM.
"""

import json
import re
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from backend.models import MedicalRecord
from backend.models.ai_models import HealthRecommendation
from backend.services.ollama_client import ollama_client


RECOMMENDATION_SYSTEM_PROMPT = """You are a health wellness advisor. Based on a patient's medical history, generate personalized health recommendations.

You MUST respond in valid JSON format as an array of recommendation objects:
[
  {
    "category": "lifestyle|exercise|diet|screening|followup",
    "title": "Short recommendation title",
    "description": "Detailed, actionable recommendation in 1-2 sentences",
    "confidence": 0.8
  }
]

Rules:
- Generate 3-6 recommendations based on the available data
- Use confidence scores: 0.9+ for strong evidence, 0.6-0.8 for moderate, 0.3-0.5 for general
- Categories must be one of: lifestyle, exercise, diet, screening, followup
- Be specific and actionable
- NEVER provide medical diagnoses or prescribe treatments
- Frame as wellness suggestions, not medical advice
- Always return valid JSON array"""


class RecommendationService:
    """
    Service for generating and managing personalized health recommendations.
    """

    @staticmethod
    def build_health_profile(records: list[MedicalRecord]) -> str:
        """
        Constructs a comprehensive health profile summary from all user records.

        Args:
            records (list[MedicalRecord]): All medical records for the user.

        Returns:
            str: A structured text profile for the LLM.
        """
        if not records:
            return "No medical records available."

        all_diagnoses = set()
        all_medications = []
        all_vitals = []
        categories = {}
        doctors = set()
        date_range = [None, None]

        for record in records:
            # Collect diagnoses
            for d in (record.diagnoses or []):
                all_diagnoses.add(d)

            # Collect medications
            for m in (record.medications or []):
                all_medications.append(m)

            # Collect vitals with date context
            for v in (record.vitals or []):
                v_copy = dict(v)
                v_copy["record_date"] = str(record.record_date) if record.record_date else "unknown"
                all_vitals.append(v_copy)

            # Track categories
            cat = record.category or "Other"
            categories[cat] = categories.get(cat, 0) + 1

            if record.doctor:
                doctors.add(record.doctor)

            if record.record_date:
                if date_range[0] is None or record.record_date < date_range[0]:
                    date_range[0] = record.record_date
                if date_range[1] is None or record.record_date > date_range[1]:
                    date_range[1] = record.record_date

        parts = []
        parts.append(f"Total Records: {len(records)}")
        if date_range[0]:
            parts.append(f"Record Date Range: {date_range[0]} to {date_range[1]}")

        if all_diagnoses:
            parts.append(f"Diagnosed Conditions: {', '.join(all_diagnoses)}")

        if all_medications:
            med_names = list(set(m.get("name", "Unknown") for m in all_medications))
            parts.append(f"Current/Past Medications: {', '.join(med_names)}")

        if all_vitals:
            # Group by metric, show latest value
            latest = {}
            for v in all_vitals:
                metric = v.get("metric", "")
                if metric and metric not in latest:
                    latest[metric] = v
            vital_lines = []
            for metric, v in latest.items():
                line = f"  {metric}: {v.get('value', '?')} {v.get('unit', '')} [{v.get('status', 'Unknown')}]"
                vital_lines.append(line)
            parts.append("Latest Vitals/Lab Results:\n" + "\n".join(vital_lines))

        return "\n".join(parts)

    @staticmethod
    def generate_recommendations(user_id: int, db: Session) -> list[HealthRecommendation]:
        """
        Generates personalized health recommendations for a user.

        Deactivates all existing recommendations and creates new ones
        based on the user's complete medical history.

        Args:
            user_id (int): The user ID.
            db (Session): Active database session.

        Returns:
            list[HealthRecommendation]: The newly created recommendations.
        """
        # Get all records for the user
        records = (
            db.query(MedicalRecord)
            .filter(MedicalRecord.user_id == user_id)
            .order_by(MedicalRecord.record_date.desc())
            .all()
        )

        if not records:
            return []

        # Build health profile
        profile = RecommendationService.build_health_profile(records)

        # Call Ollama
        prompt = f"Based on this patient's medical history, generate personalized health recommendations:\n\n{profile}"

        try:
            response_text = ollama_client.generate(
                prompt=prompt,
                system=RECOMMENDATION_SYSTEM_PROMPT,
                temperature=0.4,
            )
        except Exception as e:
            print(f"Recommendation generation failed: {e}")
            return []

        # Parse response
        recommendations_data = RecommendationService._parse_response(response_text)

        if not recommendations_data:
            return []

        # Deactivate existing recommendations
        db.query(HealthRecommendation).filter(
            HealthRecommendation.user_id == user_id,
            HealthRecommendation.is_active == True,
        ).update({"is_active": False})
        db.commit()

        # Create new recommendations
        record_ids = [r.id for r in records[:5]]  # Reference up to 5 most recent records
        new_recs = []

        for rec_data in recommendations_data:
            category = rec_data.get("category", "lifestyle")
            if category not in ("lifestyle", "exercise", "diet", "screening", "followup"):
                category = "lifestyle"

            rec = HealthRecommendation(
                user_id=user_id,
                category=category,
                title=rec_data.get("title", "General Recommendation"),
                description=rec_data.get("description", ""),
                confidence=min(max(rec_data.get("confidence", 0.5), 0.0), 1.0),
                source_records=record_ids,
                model_used=ollama_client.model,
                is_active=True,
                expires_at=datetime.utcnow() + timedelta(days=7),
            )
            db.add(rec)
            new_recs.append(rec)

        db.commit()
        for rec in new_recs:
            db.refresh(rec)

        return new_recs

    @staticmethod
    def _parse_response(response_text: str) -> list[dict]:
        """
        Parses the LLM's JSON array response into recommendation dicts.

        Args:
            response_text (str): Raw LLM output.

        Returns:
            list[dict]: Parsed recommendation objects.
        """
        try:
            # Find JSON array in response
            json_match = re.search(r'\[[\s\S]*\]', response_text)
            if json_match:
                data = json.loads(json_match.group())
                if isinstance(data, list):
                    return data[:6]  # Cap at 6 recommendations
        except (json.JSONDecodeError, AttributeError):
            pass
        return []

    @staticmethod
    def get_active_recommendations(user_id: int, db: Session) -> list[HealthRecommendation]:
        """
        Retrieves all active (non-expired) recommendations for a user.

        Args:
            user_id (int): The user ID.
            db (Session): Active database session.

        Returns:
            list[HealthRecommendation]: Active recommendations.
        """
        return (
            db.query(HealthRecommendation)
            .filter(
                HealthRecommendation.user_id == user_id,
                HealthRecommendation.is_active == True,
            )
            .order_by(HealthRecommendation.created_at.desc())
            .all()
        )
