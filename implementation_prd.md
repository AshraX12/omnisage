# Implementation Product Requirements Document (PRD)
## Project: Omnisage Medical Record Aggregator

This document outlines the architecture, technology stack, directory structure, file naming conventions, and api specifications for building the Omnisage Medical Record Aggregator web application.

---

## 1. Goal Description
The objective is to build a web application where users can upload and manage their medical history in any format (scanned reports, digital PDFs, camera photos, and DICOM imaging). The application will differentiate its architecture into a modern Python-based backend and a React/Tailwind CSS-based frontend.

---

## 2. Technology Stack & Key Libraries

### Backend (Python)
We will use **FastAPI** as the backend framework due to its high performance, automatic OpenAPI documentation, and native support for asynchronous handlers and Pydantic validation.
*   **Web Framework:** FastAPI + Uvicorn (ASGI Server)
*   **Database:** PostgreSQL (using SQLModel or SQLAlchemy + psycopg2-binary for database migrations and queries).
*   **PDF Parsing:** `pdfplumber` (for layout-preserved text and table extraction) & `PyMuPDF` (for fast text retrieval).
*   **OCR Engine:** `easyocr` (for local neural network-based text extraction from images/scans) or `pytesseract` (configured as a backup).
*   **DICOM Parsing:** `pydicom` (exclusively for parsing basic metadata tags from `.dcm` files to display scanner information and study dates in the timeline; no image-content analysis required).
*   **Data Validation:** `pydantic` (schemas for FHIR alignment and endpoint payloads).
*   **Form & File Handling:** `python-multipart` (for parsing uploads).

### Frontend (React + Tailwind CSS)
*   **Build Tool:** Vite (for fast HMR and lightweight bundle sizes).
*   **Default Landing Page:** The home route (`/`) serves directly as the User Dashboard, displaying all personal medical stats, biometric trends, upload triggers, and chronological history widgets.
*   **Styling:** Tailwind CSS (utility-first CSS with HSL variables for dynamic theme control).
*   **Icons:** Lucide React.
*   **Data Visualization:** Recharts (for dynamic vitals and biometric charts).
*   **DICOM Visualizer:** DWV (DICOM Web Viewer) or Cornerstone3D (for high-performance in-browser medical image slicing).

---

## 3. Directory & File Structure

All source code files must be placed in their respective `frontend/` or `backend/` folders. File and directory names will reflect their functions clearly. 

Every single Python and Javascript file MUST begin with a file-level docstring explaining its purpose, and every function/class MUST include a docstring outlining its behavior, arguments, and return types.

```text
omnisage/
├── backend/
│   ├── main.py                     # Entry point of the FastAPI application
│   ├── config.py                   # Application configurations and environmental settings
│   ├── database.py                 # PostgreSQL database connection and session management using SQLAlchemy
│   ├── models/
│   │   ├── __init__.py
│   │   ├── record_models.py        # Pydantic schemas for medical records and parsed FHIR JSONs
│   │   └── user_models.py          # Pydantic schemas for user profiles and sharing configurations
│   ├── parsers/
│   │   ├── __init__.py
│   │   ├── document_parser.py      # Core parser router mapping file MIME types to handlers
│   │   ├── pdf_parser.py           # Digital PDF text and table extractor (pdfplumber)
│   │   ├── ocr_parser.py           # Scanned document image OCR processor (EasyOCR)
│   │   └── dicom_parser.py         # Medical imaging DICOM parser (pydicom)
│   └── routers/
│       ├── __init__.py
│       ├── upload_router.py        # Endpoints for file uploading and ingestion parsing
│       ├── records_router.py       # Endpoints for retrieving, editing, and deleting records
│       └── sharing_router.py       # Endpoints for secure sharing links and ICE access
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx                # React app entry point
│       ├── index.css               # Tailwind CSS directives and theme variables
│       ├── App.jsx                 # Main application dashboard layout and routing
│       ├── components/
│       │   ├── FileUploadZone.jsx   # Drag-and-drop file upload box
│       │   ├── HealthTimeline.jsx   # Interactive chronological scroll list
│       │   ├── VitalsChart.jsx      # Biometrics history charts
│       │   ├── DicomViewer.jsx      # Cornerstone3D canvas for MRI/CT scan slice viewing
│       │   ├── RecordDetailModal.jsx# Details panel with medical term translation glossary
│       │   └── SecureShareModal.jsx # Consent options and expiring sharing link generator
│       └── services/
│           └── apiService.js       # API fetch wrapper for backend endpoints
└── implementation_prd.md           # This document (at root level)
```

---

## 4. Coding & Documentation Standards

### Docstring Requirements
1.  **File-Level Docstring:** Every file must start with a block comment (or module-level docstring) explaining the module's scope, dependencies, and responsibility.
2.  **Function-Level Docstring:** Every function must specify arguments, return types, exceptions raised, and a summary of business logic.

*Example (Python Backend):*
```python
"""
This module contains helper functions for parsing metadata out of DICOM files.
Dependencies: pydicom
"""

def extract_dicom_tags(file_bytes: bytes) -> dict:
    """
    Parses a DICOM file in bytes and extracts demographic and scan metadata tags.

    Args:
        file_bytes (bytes): The raw binary content of the DICOM file.

    Returns:
        dict: A dictionary containing patient name, study description, modality, and date.
    
    Raises:
        InvalidDicomError: If the bytes do not contain a valid DICOM header.
    """
    pass
```

*Example (React Frontend):*
```javascript
/**
 * FileUploadZone Component
 * Handles user drag-and-drop file inputs, performs MIME-type checks,
 * and passes valid files upward to the parent ingestion state.
 *
 * @param {Object} props
 * @param {Function} props.onFilesSelected - Callback function invoked with selected File list.
 * @returns {JSX.Element} The drag-and-drop dropzone UI.
 */
export default function FileUploadZone({ onFilesSelected }) {
  // implementation
}
```

---

## 5. API Endpoint Specifications

### 1. Ingestion: `POST /api/upload`
*   **Description:** Uploads one or more medical files to be run through the parser pipeline.
*   **Request Type:** `multipart/form-data`
*   **Response (JSON):**
    ```json
    {
      "message": "File parsed successfully",
      "record_id": "rec_98234",
      "file_name": "lab_report_complete.pdf",
      "file_type": "PDF/Structured",
      "parsed_data": {
        "record_date": "2026-05-20",
        "category": "Lab Report",
        "doctor": "Dr. Sarah Smith",
        "diagnoses": ["Vitamin D Deficiency"],
        "medications": [
          {"name": "Vitamin D3", "dosage": "50000 IU", "frequency": "Weekly"}
        ],
        "vitals_extracted": [
          {"metric": "25-Hydroxy Vitamin D", "value": 18.4, "unit": "ng/mL", "status": "Low"}
        ]
      }
    }
    ```

### 2. Retrieval: `GET /api/records`
*   **Description:** Returns the complete chronological medical history timeline for the active user.
*   **Response (JSON):** List of parsed records.

### 3. Sharing: `POST /api/sharing/generate`
*   **Description:** Creates an expiring link containing encrypted subsets of the records.
*   **Payload:**
    ```json
    {
      "record_ids": ["rec_98234", "rec_98235"],
      "expiry_hours": 24,
      "passcode_protection": true
    }
    ```
*   **Response (JSON):** Secure sharing URL and temporary access credentials.

---

## 6. Verification Plan

### Automated Tests
*   **Backend:** Write pytest cases verifying each parser:
    *   `test_pdf_parser.py`: Verify test cases extract correct fields from simulated lab reports.
    *   `test_dicom_parser.py`: Verify metadata tags (modality, scan date) are correctly mapped.
    *   `test_ocr_parser.py`: Verify EasyOCR returns clean text strings from sample image blobs.
*   **Frontend:** Verification of component layouts and mock API services.

### Manual Verification
*   User testing of drag-and-drop folder uploads, observing real-time progress bars.
*   Testing DICOM interactive canvas rendering (scrolling through slice pages).
*   Validating responsiveness across desktop and mobile screens.

---

## 7. Configuration Decisions
1.  **AI Engine API Keys:** We will implement offline parsing using Python libraries (`pdfplumber` and `easyocr`) with pre-built regex-based matching for key biometrics (e.g. Hemoglobin, Vitamin D, Cholesterol, Blood Pressure, Glucose), but structure the extraction pipeline modularly so that LLM clinical APIs can be plugged in later.
2.  **Database Storage:** PostgreSQL is selected as the primary relational database, using SQLModel/SQLAlchemy to structure and store the users, record documents, parsed metrics, and sharing metadata.
3.  **DICOM Viewer Scope:** No backend processing/image-analysis is required for scans like MRIs or CTs. The file is uploaded and available on the platform for in-browser client-side viewing when needed, and the backend only parses standard file header tags (modality, scan date, study description) using `pydicom` to list it in the timeline.
