"""
Upload Router Module for Omnisage Medical Record Aggregator.

This module exposes the FastAPI endpoints to upload files (PDFs, DICOMs, and images),
saves them to the uploads folder, passes them to the parsing pipeline, and saves
the resulting structured observations to the database.
"""

import os
import shutil
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from backend.config import settings
from backend.database import get_db
from backend.models import MedicalRecord, User
from backend.parsers import parse_document
from backend.models.schemas import MedicalRecordResponse

# Initialize APIRouter
router = APIRouter(
    prefix="/api/upload",
    tags=["Uploads"]
)


@router.post("", response_model=MedicalRecordResponse)
def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
) -> MedicalRecordResponse:
    """
    Handles file upload, saves it to disk, routes it to the correct parser,
    and stores the clinical observations in the PostgreSQL database.

    Args:
        file (UploadFile): The uploaded file multipart payload.
        db (Session): The database session.

    Returns:
        MedicalRecordResponse: The structured record details saved in the database.
    
    Raises:
        HTTPException: If the file extension is unsupported or parsing fails.
    """
    # Verify file extension is supported
    file_name = file.filename
    ext = os.path.splitext(file_name.lower())[1]
    supported_exts = [".pdf", ".dcm", ".dicom", ".png", ".jpg", ".jpeg", ".heic"]
    
    if ext not in supported_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format: {ext}. Supported: {', '.join(supported_exts)}"
        )

    # Resolve default user (ID = 1) for the prototype
    default_user = db.query(User).filter(User.id == 1).first()
    if not default_user:
        # Create a default user on the fly if not exists
        default_user = User(
            id=1,
            email="patient@omnisage.com",
            full_name="Default Patient",
            hashed_password="mocked_password_hash"
        )
        db.add(default_user)
        db.commit()
        db.refresh(default_user)

    # Generate a unique filename to prevent namespace collisions on disk
    unique_filename = f"{uuid.uuid4()}{ext}"
    dest_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    # Save uploaded file bytes to disk
    try:
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save file to disk: {str(e)}"
        )

    # Run the file through the parser pipeline
    try:
        parsed_data = parse_document(dest_path, file_name)
    except Exception as parse_err:
        # Clean up file on disk if parsing fails
        if os.path.exists(dest_path):
            os.remove(dest_path)
        raise HTTPException(
            status_code=422,
            detail=f"Parsing error: {str(parse_err)}"
        )

    # Create the medical record in the database
    new_record = MedicalRecord(
        user_id=default_user.id,
        file_name=file_name,
        file_path=unique_filename,  # Store the relative unique filename
        file_type=ext.lstrip("."),
        category=parsed_data.get("category", "Other"),
        record_date=parsed_data.get("record_date"),
        doctor=parsed_data.get("doctor"),
        diagnoses=parsed_data.get("diagnoses", []),
        medications=parsed_data.get("medications", []),
        vitals=parsed_data.get("vitals", []),
        raw_text=parsed_data.get("raw_text"),
        dicom_metadata=parsed_data.get("dicom_metadata"),
        is_reviewed=False,
        uploaded_at=datetime.utcnow()
    )

    try:
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
    except Exception as db_err:
        if os.path.exists(dest_path):
            os.remove(dest_path)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to record data in database: {str(db_err)}"
        )

    return new_record
