"""
Records Router Module for Omnisage Medical Record Aggregator.

This module exposes the FastAPI endpoints to query, update, delete, and download
stored medical records and their binary payloads (PDFs, DICOMs, and images).
"""

import os
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from backend.config import settings
from backend.database import get_db
from backend.models import MedicalRecord
from backend.models.schemas import MedicalRecordResponse, MedicalRecordUpdate

# Initialize APIRouter
router = APIRouter(
    prefix="/api/records",
    tags=["Records"]
)


@router.get("", response_model=list[MedicalRecordResponse])
def get_all_records(db: Session = Depends(get_db)) -> list[MedicalRecordResponse]:
    """
    Retrieves all medical records for the user in chronological order by record_date.

    Args:
        db (Session): The database session.

    Returns:
        list[MedicalRecordResponse]: A list of all records.
    """
    records = db.query(MedicalRecord).order_by(
        MedicalRecord.uploaded_at.desc()
    ).all()
    return records


@router.get("/{record_id}", response_model=MedicalRecordResponse)
def get_record_details(record_id: int, db: Session = Depends(get_db)) -> MedicalRecordResponse:
    """
    Retrieves details for a specific medical record.

    Args:
        record_id (int): The ID of the record to retrieve.
        db (Session): The database session.

    Returns:
        MedicalRecordResponse: The medical record database record.
    """
    record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Medical record not found.")
    return record


@router.put("/{record_id}", response_model=MedicalRecordResponse)
def update_record(
    record_id: int,
    payload: MedicalRecordUpdate,
    db: Session = Depends(get_db)
) -> MedicalRecordResponse:
    """
    Updates the clinical fields of a medical record (e.g. following user/doctor edits).

    Args:
        record_id (int): The ID of the record to update.
        payload (MedicalRecordUpdate): The updated fields.
        db (Session): The database session.

    Returns:
        MedicalRecordResponse: The updated record details.
    """
    record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Medical record not found.")

    # Update values if provided in the request payload
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(record, key, value)

    db.commit()
    db.refresh(record)
    return record


@router.delete("/{record_id}")
def delete_record(record_id: int, db: Session = Depends(get_db)) -> dict[str, str]:
    """
    Deletes a medical record from the database and removes its associated file from disk.

    Args:
        record_id (int): The ID of the record to delete.
        db (Session): The database session.

    Returns:
        dict: A success message confirmation.
    """
    record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Medical record not found.")

    # Remove associated file from disk if it exists
    file_path = os.path.join(settings.UPLOAD_DIR, record.file_path)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            # Log disk deletion failure but continue deleting db row to prevent orphan locks
            print(f"Failed to delete file {file_path}: {str(e)}")

    db.delete(record)
    db.commit()
    return {"message": "Record deleted successfully."}


@router.get("/{record_id}/file")
def download_record_file(record_id: int, db: Session = Depends(get_db)) -> FileResponse:
    """
    Serves the raw binary file (PDF, DICOM, or image) stored on the server.

    Args:
        record_id (int): The ID of the record.
        db (Session): The database session.

    Returns:
        FileResponse: The physical file payload with correct content-type header.
    """
    record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Medical record not found.")

    file_path = os.path.join(settings.UPLOAD_DIR, record.file_path)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Physical file not found on disk.")

    # Determine standard media types
    media_type = "application/octet-stream"
    ext = os.path.splitext(record.file_name.lower())[1]
    if ext == ".pdf":
        media_type = "application/pdf"
    elif ext in [".png", ".jpg", ".jpeg"]:
        media_type = f"image/{ext.lstrip('.')}"
    elif ext in [".dcm", ".dicom"]:
        media_type = "application/dicom"

    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=record.file_name
    )
