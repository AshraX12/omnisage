"""
Document Parser Routing Module for Omnisage Medical Record Aggregator.

This module acts as the router for the parsing pipeline. It inspects the file extension
and routes the document to the PDF parser, Image OCR parser, or DICOM metadata parser.
"""

import os
from typing import Any
from backend.parsers.pdf_parser import parse_pdf
from backend.parsers.ocr_parser import parse_image_ocr
from backend.parsers.dicom_parser import parse_dicom


def parse_document(file_path: str, file_name: str) -> dict[str, Any]:
    """
    Routes an uploaded file to the appropriate parser based on its file extension.

    Args:
        file_path (str): The absolute path to the stored file.
        file_name (str): The original filename uploaded by the user.

    Returns:
        dict: A structured dictionary of the clinical observations.
    
    Raises:
        ValueError: If the file type is unsupported.
    """
    ext = os.path.splitext(file_name.lower())[1]

    if ext == ".pdf":
        try:
            # First, attempt normal digital PDF text extraction
            return parse_pdf(file_path)
        except Exception:
            # Fall back to image-based OCR parsing if digital extraction fails
            # (e.g. if the PDF contains scanned pages saved as images)
            try:
                return parse_image_ocr(file_path)
            except Exception as ocr_err:
                raise ValueError(f"Failed to parse PDF even with OCR: {str(ocr_err)}")

    elif ext in [".dcm", ".dicom"]:
        return parse_dicom(file_path)

    elif ext in [".png", ".jpg", ".jpeg", ".heic"]:
        return parse_image_ocr(file_path)

    else:
        raise ValueError(f"Unsupported file format: {ext}")
