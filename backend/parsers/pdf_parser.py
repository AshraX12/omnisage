"""
PDF Parser Module for Omnisage Medical Record Aggregator.

This module provides utilities to open digital PDFs, extract raw text, identify tables
(such as lab panel structures), and parse key clinical indicators (vitals, diagnoses, and biometrics)
using regex heuristics.
"""

import re
from datetime import datetime, date
from typing import Any, Optional
import pdfplumber


def parse_pdf(file_path: str) -> dict[str, Any]:
    """
    Parses a digital PDF document using pdfplumber to extract text, tables,
    and parse common medical biometrics, dates, and names.

    Args:
        file_path (str): The absolute filesystem path to the PDF file.

    Returns:
        dict: A dictionary containing extracted clinical fields:
            - record_date (date/None)
            - category (str)
            - doctor (str/None)
            - diagnoses (list)
            - medications (list)
            - vitals (list)
            - raw_text (str)
    """
    raw_text = ""
    extracted_tables = []

    # Open PDF and extract text and tables
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                raw_text += page_text + "\n"
            
            # Extract tables if present (useful for lab reports)
            tables = page.extract_tables()
            for table in tables:
                if table:
                    extracted_tables.append(table)

    # Apply heuristics to classify category
    category = "Other"
    lower_text = raw_text.lower()
    if any(x in lower_text for x in ["lab", "panel", "cbc", "lipid", "cholesterol", "hba1c", "blood test", "hemoglobin"]):
        category = "Lab Report"
    elif any(x in lower_text for x in ["prescription", "rx", "mg", "tablet", "capsule", "sig:", "refills"]):
        category = "Prescription"
    elif any(x in lower_text for x in ["soap note", "progress note", "clinical note", "consultation", "patient note"]):
        category = "Doctor Note"

    # Heuristic: Extract record date
    record_date = _extract_date(raw_text)

    # Heuristic: Extract doctor name
    doctor = _extract_doctor(raw_text)

    # Parse biometrics / vitals
    vitals = _parse_vitals(raw_text, extracted_tables)

    # Parse diagnoses
    diagnoses = _parse_diagnoses(raw_text)

    # Parse medications
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


def _extract_date(text: str) -> Optional[date]:
    """
    Search for dates in text (e.g. YYYY-MM-DD, MM/DD/YYYY, or Month DD, YYYY).
    """
    # Regex patterns
    iso_pattern = r"\b(\d{4})[-/](\d{2})[-/](\d{2})\b"
    us_pattern = r"\b(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})\b"
    written_pattern = r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},\s*\d{4}\b"

    # Check ISO first
    match = re.search(iso_pattern, text)
    if match:
        try:
            return datetime.strptime(match.group(0), "%Y-%m-%d").date()
        except ValueError:
            pass

    # Check US pattern
    match = re.search(us_pattern, text)
    if match:
        date_str = match.group(0)
        for fmt in ("%m/%d/%Y", "%m/%d/%y", "%d/%m/%Y", "%d/%m/%y"):
            try:
                return datetime.strptime(date_str, fmt).date()
            except ValueError:
                continue

    # Check written date
    match = re.search(written_pattern, text, re.IGNORECASE)
    if match:
        try:
            return datetime.strptime(match.group(0), "%b %d, %Y").date()
        except ValueError:
            try:
                return datetime.strptime(match.group(0), "%B %d, %Y").date()
            except ValueError:
                pass

    return None


def _extract_doctor(text: str) -> Optional[str]:
    """
    Search for doctor names in text (e.g. Dr. John Smith, MD).
    """
    doc_patterns = [
        r"\b(?:Dr\.|Doctor)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)+)",
        r"(?:Physician|Provider|Practitioner):\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)+)",
        r"\b([A-Z][a-zA-Z]+\s+[A-Z][a-zA-Z]+),\s*(?:MD|DO|NP|PA-C)\b"
    ]
    
    for pattern in doc_patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1) if len(match.groups()) > 0 else match.group(0)
    return None


def _parse_vitals(text: str, tables: list) -> list:
    """
    Extract common vitals/biometrics from text and tables.
    Matches metrics like Blood Pressure, Vitamin D, Cholesterol, Hemoglobin, Glucose, Height, Weight.
    """
    vitals = []
    text_lower = text.lower()

    # Define vital targets and patterns: (metric name, unit, regex)
    vital_patterns = [
        ("Hemoglobin", "g/dL", r"hemoglobin\s*[:\-]?\s*(\d{1,2}(?:\.\d{1,2})?)"),
        ("Vitamin D", "ng/mL", r"vitamin d(?:,\s*25-hydroxy)?\s*[:\-]?\s*(\d{1,3}(?:\.\d{1,2})?)"),
        ("Total Cholesterol", "mg/dL", r"total cholesterol\s*[:\-]?\s*(\d{1,3})"),
        ("LDL Cholesterol", "mg/dL", r"ldl\s*(?:cholesterol)?\s*[:\-]?\s*(\d{1,3})"),
        ("HDL Cholesterol", "mg/dL", r"hdl\s*(?:cholesterol)?\s*[:\-]?\s*(\d{1,3})"),
        ("Fasting Glucose", "mg/dL", r"glucose\s*[:\-]?\s*(\d{1,3})"),
        ("Systolic Blood Pressure", "mmHg", r"bp|blood pressure\s*[:\-]?\s*(\d{2,3})/\d{2,3}"),
        ("Diastolic Blood Pressure", "mmHg", r"bp|blood pressure\s*[:\-]?\s*\d{2,3}/(\d{2,3})"),
        ("Weight", "lbs", r"weight\s*[:\-]?\s*(\d{2,3}(?:\.\d{1,2})?)\s*lbs"),
        ("Heart Rate", "bpm", r"heart rate|pulse|hr\s*[:\-]?\s*(\d{2,3})\s*(?:bpm|bpm|/min)?")
    ]

    # Search in text
    for metric, unit, pattern in vital_patterns:
        match = re.search(pattern, text_lower)
        if match:
            try:
                val = float(match.group(1))
                # Add status assessment
                status = "Normal"
                if metric == "Vitamin D" and val < 30:
                    status = "Low"
                elif metric == "Total Cholesterol" and val >= 200:
                    status = "High"
                elif metric == "Systolic Blood Pressure" and val >= 130:
                    status = "High"
                
                vitals.append({
                    "metric": metric,
                    "value": val,
                    "unit": unit,
                    "status": status
                })
            except ValueError:
                pass

    # Search in extracted tables (common for blood panels)
    for table in tables:
        for row in table:
            # Flatten/clean cells
            row_clean = [str(cell).strip().lower() for cell in row if cell]
            if len(row_clean) < 2:
                continue
            
            # Look for row matching key metrics
            for metric, unit, pattern in vital_patterns:
                if any(metric.lower() in cell for cell in row_clean):
                    # Find numerical values in subsequent columns
                    for cell in row_clean[1:]:
                        num_match = re.search(r"(\d+(?:\.\d+)?)", cell)
                        if num_match:
                            try:
                                val = float(num_match.group(1))
                                # Prevent duplicates
                                if not any(v["metric"] == metric for v in vitals):
                                    vitals.append({
                                        "metric": metric,
                                        "value": val,
                                        "unit": unit,
                                        "status": "Normal"  # Default
                                    })
                                break
                            except ValueError:
                                pass

    return vitals


def _parse_diagnoses(text: str) -> list:
    """
    Search for common diagnoses or chronic conditions mentioned in medical text.
    """
    conditions = [
        "hypertension", "diabetes", "hyperlipidemia", "anemia",
        "hypothyroidism", "asthma", "gerd", "vitamin d deficiency",
        "depression", "anxiety", "arthritis", "obesity"
    ]
    
    found = []
    text_lower = text.lower()
    for cond in conditions:
        if cond in text_lower:
            # Avoid matching negated conditions (e.g. "no history of hypertension")
            # Simple check for negation in preceding characters
            pos = text_lower.find(cond)
            preceding = text_lower[max(0, pos-20):pos]
            if not any(neg in preceding for neg in ["no history", "negative for", "denies", "no signs", "rule out"]):
                found.append(cond.title())
    return found


def _parse_medications(text: str) -> list:
    """
    Extract common prescriptions with dosage if mentioned.
    """
    medications = []
    
    # Common drugs list
    drugs = [
        "lisinopril", "metformin", "atorvastatin", "levothyroxine", 
        "albuterol", "amlodipine", "omeprazole", "gabapentin", 
        "sertraline", "losartan", "vitamin d3", "ibuprofen"
    ]
    
    # Pattern: drug name followed by dosage (e.g., 10 mg, 500mg, 50,000 IU) and optional frequency
    for drug in drugs:
        pattern = rf"\b{drug}\b\s*(?:tablet|capsule|mg|mcg|iu)?\s*(\d+(?:,\d+)?\s*(?:mg|mcg|iu|g))\b"
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            # Look for frequency
            freq = "As directed"
            freq_patterns = [
                (r"once daily|daily|qd", "Once daily"),
                (r"twice daily|bid", "Twice daily"),
                (r"three times daily|tid", "Three times daily"),
                (r"at bedtime|qhs", "At bedtime"),
                (r"weekly", "Weekly")
            ]
            
            pos = match.start()
            sentence = text[pos:pos+100].lower()
            for fp, f_name in freq_patterns:
                if re.search(fp, sentence):
                    freq = f_name
                    break
                    
            medications.append({
                "name": drug.title(),
                "dosage": match.group(1),
                "frequency": freq
            })
            
    return medications
