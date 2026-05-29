"""
Medical Record Models Module for Omnisage Medical Record Aggregator.

This module defines the SQLAlchemy database models representing user medical records,
parsed structured clinical data, and biometrics.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON, Date, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base


class MedicalRecord(Base):
    """
    SQLAlchemy model representing an uploaded medical document or scan
    along with its metadata and parsed clinical observations.
    """
    __tablename__ = "medical_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # 'pdf_structured', 'pdf_scanned', 'image', 'dicom'
    category = Column(String, default="Other")  # 'Lab Report', 'Doctor Note', 'Prescription', 'Imaging'
    record_date = Column(Date, nullable=True)
    doctor = Column(String, nullable=True)
    
    # Structured fields mapped as JSON arrays
    diagnoses = Column(JSON, default=list)  # List of strings, e.g. ["Vitamin D Deficiency"]
    medications = Column(JSON, default=list)  # List of dicts, e.g. [{"name": "D3", "dosage": "50k", "frequency": "weekly"}]
    vitals = Column(JSON, default=list)  # List of dicts, e.g. [{"metric": "Hemoglobin", "value": 14.2, "unit": "g/dL", "status": "Normal"}]
    
    raw_text = Column(String, nullable=True)  # Full raw extracted text or OCR payload
    dicom_metadata = Column(JSON, nullable=True)  # Header tags parsed from DICOM file
    is_reviewed = Column(Boolean, default=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="records")
