"""
Sharing Router Module for Omnisage Medical Record Aggregator.

This module exposes endpoints to generate secure, expiring sharing links that grant
read-only access to selected subsets of medical records, as well as accessing those links.
"""

import uuid
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import SharedLink, MedicalRecord
from backend.models.schemas import SharedLinkCreate, SharedLinkResponse, MedicalRecordResponse

# Initialize APIRouter
router = APIRouter(
    prefix="/api/sharing",
    tags=["Sharing"]
)


@router.post("/generate", response_model=SharedLinkResponse)
def generate_sharing_link(
    payload: SharedLinkCreate,
    db: Session = Depends(get_db)
) -> SharedLinkResponse:
    """
    Generates a secure, temporary sharing link that grants access to a specific
    list of medical record IDs.

    Args:
        payload (SharedLinkCreate): Configuration containing record_ids and expiry_hours.
        db (Session): The database session.

    Returns:
        SharedLinkResponse: The created shared link details.
    """
    # Verify that all record IDs exist
    existing_count = db.query(MedicalRecord).filter(
        MedicalRecord.id.in_(payload.record_ids)
    ).count()

    if existing_count != len(payload.record_ids):
        raise HTTPException(
            status_code=400,
            detail="One or more specified record IDs do not exist."
        )

    # Compute expiration time
    expiry_time = datetime.utcnow() + timedelta(hours=payload.expiry_hours)

    # Generate secure random UUID for the link key
    link_id = str(uuid.uuid4())

    # Create the link record
    new_link = SharedLink(
        id=link_id,
        creator_id=1,  # Default patient user
        record_ids=payload.record_ids,
        expiry_time=expiry_time,
        passcode_hash=payload.passcode,  # Storing plain for prototype simplicity (later hashed)
        is_active=True,
        created_at=datetime.utcnow()
    )

    db.add(new_link)
    db.commit()
    db.refresh(new_link)

    return new_link


@router.get("/{link_id}", response_model=list[MedicalRecordResponse])
def get_shared_records(
    link_id: str,
    passcode: Optional[str] = Query(None),
    db: Session = Depends(get_db)
) -> list[MedicalRecordResponse]:
    """
    Fetches the records shared via an active sharing link, subject to validation
    of expiration date and passcode.

    Args:
        link_id (str): The unique sharing link UUID.
        passcode (str, optional): The security passcode if required by the creator.
        db (Session): The database session.

    Returns:
        list[MedicalRecordResponse]: The list of shared medical records.
    """
    link = db.query(SharedLink).filter(SharedLink.id == link_id).first()
    
    if not link or not link.is_active:
        raise HTTPException(
            status_code=404, 
            detail="Sharing link is inactive or does not exist."
        )

    # Check expiration
    if datetime.utcnow() > link.expiry_time:
        link.is_active = False
        db.commit()
        raise HTTPException(
            status_code=410, 
            detail="Sharing link has expired."
        )

    # Verify passcode if required
    if link.passcode_hash and link.passcode_hash != passcode:
        raise HTTPException(
            status_code=401, 
            detail="Invalid passcode provided for this shared link."
        )

    records = db.query(MedicalRecord).filter(
        MedicalRecord.id.in_(link.record_ids)
    ).order_by(
        MedicalRecord.uploaded_at.desc()
    ).all()

    return records
