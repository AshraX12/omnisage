"""
DICOM Parser Module for Omnisage Medical Record Aggregator.

This module provides functions to parse DICOM (.dcm) files and extract header tags
including modality, scanner, and study description, while bypassing heavy image processing.
"""

from datetime import datetime, date
from typing import Any, Optional
import pydicom


def parse_dicom(file_path: str) -> dict[str, Any]:
    """
    Parses a DICOM (.dcm) file using pydicom and extracts basic header tags
    for display on the user's health timeline.

    Args:
        file_path (str): The absolute path to the DICOM file.

    Returns:
        dict: A dictionary containing parsed clinical metadata:
            - record_date (date/None)
            - category (str) -> always 'Imaging'
            - doctor (str/None)
            - diagnoses (list) -> empty
            - medications (list) -> empty
            - vitals (list) -> empty
            - dicom_metadata (dict) -> detailed header attributes
            - raw_text (str) -> summary string
    """
    try:
        # Load the DICOM dataset (stop_before_pixels=True speeds up load by bypassing pixel vectors)
        ds = pydicom.dcmread(file_path, stop_before_pixels=True)
    except Exception as e:
        raise ValueError(f"Invalid DICOM file: {str(e)}")

    # Extract metadata tags with safe fallback values
    patient_sex = str(ds.get("PatientSex", "Unknown"))
    patient_age = str(ds.get("PatientAge", "Unknown"))
    modality = str(ds.get("Modality", "Unknown"))
    study_desc = str(ds.get("StudyDescription", "Medical Scan"))
    institution = str(ds.get("InstitutionName", "Unknown Facility"))
    manufacturer = str(ds.get("Manufacturer", "Unknown Manufacturer"))
    model = str(ds.get("ManufacturerModelName", "Unknown Model"))
    
    # Extract study date
    study_date_raw = ds.get("StudyDate", None)
    record_date = None
    if study_date_raw:
        try:
            # DICOM dates are stored as 'YYYYMMDD'
            record_date = datetime.strptime(str(study_date_raw), "%Y%m%d").date()
        except ValueError:
            pass

    # Extract referring physician
    physician_raw = ds.get("ReferringPhysicianName", None)
    doctor = None
    if physician_raw:
        doctor = str(physician_raw).replace("^", " ").strip()

    # Compile metadata dict
    dicom_metadata = {
        "modality": modality,
        "study_description": study_desc,
        "patient_age": patient_age,
        "patient_sex": patient_sex,
        "institution_name": institution,
        "manufacturer": manufacturer,
        "model_name": model
    }

    # Summary text
    raw_text = f"Modality: {modality} | Scan of: {study_desc} | Location: {institution} | Machine: {manufacturer} {model}"

    return {
        "record_date": record_date,
        "category": "Imaging",
        "doctor": doctor,
        "diagnoses": [],
        "medications": [],
        "vitals": [],
        "dicom_metadata": dicom_metadata,
        "raw_text": raw_text
    }
