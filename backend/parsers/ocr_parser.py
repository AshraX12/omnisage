"""
OCR Parser Module for Omnisage Medical Record Aggregator.

This module utilizes EasyOCR to read text out of image files (JPEGs, PNGs, and scans)
and runs the parsed text through the clinical extraction pipeline defined in the PDF parser.
"""

import os
from typing import Any, Optional
import easyocr

# Import heuristic extraction functions from pdf_parser to maintain consistency and DRY
from backend.parsers.pdf_parser import (
    _extract_date,
    _extract_doctor,
    _parse_vitals,
    _parse_diagnoses,
    _parse_medications
)

# Global holder for EasyOCR reader instance to avoid reloading models on every API request
_reader: Optional[easyocr.Reader] = None


def get_ocr_reader() -> easyocr.Reader:
    """
    Lazy-loads and retrieves the EasyOCR Reader instance.

    Returns:
        easyocr.Reader: The initialized EasyOCR reader for English text.
    """
    global _reader
    if _reader is None:
        # Load English model. gpu=False enforces CPU mode for lightweight prototype execution.
        _reader = easyocr.Reader(['en'], gpu=False)
    return _reader


def parse_image_ocr(file_path: str) -> dict[str, Any]:
    """
    Performs OCR on an image file, extracts text blocks, joins them, and structures
    the medical biometrics.

    Args:
        file_path (str): The absolute path to the image or scanned document.

    Returns:
        dict: A dictionary containing parsed clinical fields:
            - record_date (date/None)
            - category (str)
            - doctor (str/None)
            - diagnoses (list)
            - medications (list)
            - vitals (list)
            - raw_text (str)
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    # Retrieve lazy-loaded OCR reader and read text
    reader = get_ocr_reader()
    results = reader.readtext(file_path, detail=0)
    
    # Merge result tokens into a single text block
    raw_text = "\n".join(results)

    # Classify category
    category = "Other"
    lower_text = raw_text.lower()
    if any(x in lower_text for x in ["lab", "panel", "cbc", "lipid", "cholesterol", "hba1c", "blood test", "hemoglobin"]):
        category = "Lab Report"
    elif any(x in lower_text for x in ["prescription", "rx", "mg", "tablet", "capsule", "sig:", "refills"]):
        category = "Prescription"
    elif any(x in lower_text for x in ["soap note", "progress note", "clinical note", "consultation", "patient note"]):
        category = "Doctor Note"

    # Extract structured fields using imported helper functions
    record_date = _extract_date(raw_text)
    doctor = _extract_doctor(raw_text)
    vitals = _parse_vitals(raw_text, [])  # No tables in standard flat OCR text list
    diagnoses = _parse_diagnoses(raw_text)
    medications = _parse_medications(raw_text)

    return {
        "record_date": record_date,
        "category": category,
        "doctor": doctor,
        "diagnoses": diagnoses,
        "medications": medications,
        "vitals": vitals,
        "raw_text": raw_text
    }
