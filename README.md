<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
</p>

<h1 align="center">Omnisage</h1>

<p align="center">
  <strong>Your Centralized Medical History Ledger</strong><br />
  A one-stop platform to upload, parse, organize, and securely share your complete medical records — lab reports, prescriptions, clinical notes, and DICOM imaging — all in one place.
</p>

---

## The Problem

Medical records are scattered across hospitals, clinics, labs, and imaging centers — each with their own portal, format, and login. Patients lose track of critical health data, doctors never have the full picture, and sharing records for a second opinion means chasing down paperwork.

**Omnisage** solves this by giving patients a single, self-hosted platform to:

- **Upload anything** — PDFs, scanned images, photos of prescriptions, DICOM files
- **Auto-extract clinical data** — AI-powered parsing pulls out diagnoses, medications, vitals, dates, and physicians
- **Visualize health trends** — Track biometrics like cholesterol, glucose, Vitamin D, and blood pressure over time
- **Share securely** — Generate temporary, passcode-protected links for clinician consultations

---

## Features

| Feature | Description |
|---|---|
| **Multi-Format Ingestion** | Upload PDFs, DICOM (.dcm), PNG, JPG, and HEIC files. Each format is routed to a specialized parser. |
| **AI Document Parsing** | Extracts record dates, doctor names, diagnoses, medications with dosages, and vitals using pdfplumber + EasyOCR + regex heuristics. |
| **Interactive Dashboard** | Landing page shows health summary stats, recent records, and a latest-vitals snapshot at a glance. |
| **Health Timeline** | Chronological, searchable, filterable list of all medical records with category badges and review status. |
| **Biometrics Analytics** | Recharts-powered trend line charts for Vitamin D, cholesterol, glucose, hemoglobin with clinical threshold indicators. |
| **DICOM Viewer** | Built-in browser-based viewer for medical imaging files (MRI, CT, X-ray) with window/level controls — no backend processing needed. |
| **Secure Sharing** | Generate expiring, passcode-protected links that grant read-only access to selected records for clinician consultations. |
| **Medical Glossary** | Click any extracted term (diagnosis, vital, medication) to see a plain-language patient education explanation. |
| **Record Editing** | Manually correct or add diagnoses, change categories, update physician names, and mark records as reviewed. |

---

## Tech Stack

### Backend

| Technology | Purpose |
|---|---|
| [FastAPI](https://fastapi.tiangolo.com/) | High-performance async Python web framework |
| [Uvicorn](https://www.uvicorn.org/) | ASGI server |
| [SQLAlchemy 2.0](https://www.sqlalchemy.org/) | ORM with PostgreSQL support (SQLite fallback) |
| [pdfplumber](https://github.com/jsvine/pdfplumber) | PDF text and table extraction |
| [EasyOCR](https://github.com/JaidedAI/EasyOCR) | Neural network OCR for scanned documents |
| [pydicom](https://pydicom.github.io/) | DICOM metadata tag parser |
| [Pydantic v2](https://docs.pydantic.dev/) | Request/response validation schemas |

### Frontend

| Technology | Purpose |
|---|---|
| [React 19](https://react.dev/) | Component-based UI framework |
| [Vite 8](https://vite.dev/) | Lightning-fast build tool with HMR |
| [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first CSS with `@theme` design tokens |
| [Recharts](https://recharts.org/) | Composable charting library for biometrics |
| [Lucide React](https://lucide.dev/) | Clean, consistent icon set |
| [Axios](https://axios-http.com/) | HTTP client for API communication |

---

## Project Structure

```
omnisage/
├── backend/
│   ├── main.py                  # FastAPI app entry point, CORS config, startup seed
│   ├── config.py                # Environment settings (upload dir, DB URL)
│   ├── database.py              # SQLAlchemy engine, session, and Base (PostgreSQL → SQLite fallback)
│   ├── requirements.txt         # Python dependencies
│   ├── models/
│   │   ├── __init__.py          # Model exports
│   │   ├── record_models.py     # MedicalRecord SQLAlchemy model
│   │   ├── user_models.py       # User and SharedLink models
│   │   └── schemas.py           # Pydantic request/response schemas
│   ├── parsers/
│   │   ├── __init__.py          # Parser exports
│   │   ├── document_parser.py   # MIME-type router → delegates to specific parsers
│   │   ├── pdf_parser.py        # PDF text/table extraction + vitals/diagnosis heuristics
│   │   ├── ocr_parser.py        # Image OCR via EasyOCR + same heuristics pipeline
│   │   └── dicom_parser.py      # DICOM metadata extraction (modality, dates, patient info)
│   └── routers/
│       ├── __init__.py          # Router exports
│       ├── upload_router.py     # POST /api/upload — file ingestion + parsing
│       ├── records_router.py    # GET/PUT/DELETE /api/records — CRUD operations
│       └── sharing_router.py    # POST /api/sharing/generate, GET /api/sharing/:id
│
├── frontend/
│   ├── index.html               # HTML entry point
│   ├── package.json             # Node dependencies and scripts
│   ├── vite.config.js           # Vite build configuration
│   ├── tailwind.config.js       # Tailwind CSS theme tokens
│   ├── postcss.config.js        # PostCSS pipeline (@tailwindcss/postcss)
│   └── src/
│       ├── main.jsx             # React DOM root mount
│       ├── index.css            # Global styles, @theme tokens, component classes
│       ├── App.jsx              # App shell — sidebar + page router + share portal
│       ├── components/
│       │   ├── Sidebar.jsx      # Fixed left navigation with 5 tabs + user card
│       │   ├── FileUploadZone.jsx   # Drag-and-drop multi-file upload with progress
│       │   ├── HealthTimeline.jsx   # Searchable, filterable chronological record list
│       │   ├── VitalsChart.jsx      # Recharts biometrics trend chart with thresholds
│       │   ├── DicomViewer.jsx      # Zero-dependency canvas DICOM renderer
│       │   ├── RecordDetailModal.jsx # Full record viewer/editor with glossary
│       │   └── SecureShareModal.jsx  # Share link generator (legacy modal mode)
│       ├── pages/
│       │   ├── DashboardPage.jsx    # Overview: stats, recent records, vitals snapshot
│       │   ├── RecordsPage.jsx      # Full timeline with filters
│       │   ├── AnalyticsPage.jsx    # Vitals charts + current readings grid
│       │   ├── UploadPage.jsx       # Upload zone + session log + format info
│       │   └── SharePage.jsx        # Full-page secure link generator
│       └── services/
│           └── apiService.js    # Axios wrapper for all backend API calls
│
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- **Python 3.12+** — [Download](https://www.python.org/downloads/)
- **Node.js 20+** — [Download](https://nodejs.org/)
- **PostgreSQL 16** *(optional — the app auto-falls back to SQLite if Postgres isn't available)*

### 1. Clone the Repository

```bash
git clone https://github.com/AshraX12/omnisage.git
cd omnisage
```

### 2. Backend Setup

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
cd frontend

# Install Node dependencies
npm install
```

### 4. Database Configuration *(Optional)*

By default, Omnisage uses a local **SQLite** database (`omnisage.db`) that gets created automatically — no setup needed.

To use **PostgreSQL** instead, set the `DATABASE_URL` environment variable before starting the backend:

```bash
# Windows PowerShell:
$env:DATABASE_URL = "postgresql://postgres:yourpassword@localhost:5432/omnisage"

# macOS/Linux:
export DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/omnisage"
```

Make sure the `omnisage` database exists in your PostgreSQL instance.

### 5. Run the Application

**Terminal 1 — Start the backend:**

```bash
cd backend
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

> **Note:** Run the `uvicorn` command from the **project root** (`omnisage/`), not from inside `backend/`.
> Alternatively: `cd omnisage && python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload`

**Terminal 2 — Start the frontend:**

```bash
cd frontend
npm run dev
```

### 6. Open the App

| Service | URL |
|---|---|
| **Frontend (UI)** | [http://localhost:5173](http://localhost:5173) |
| **Backend API** | [http://localhost:8000](http://localhost:8000) |
| **API Docs (Swagger)** | [http://localhost:8000/docs](http://localhost:8000/docs) |
| **API Docs (ReDoc)** | [http://localhost:8000/redoc](http://localhost:8000/redoc) |

---

## API Reference

All endpoints are prefixed with `/api`.

### Upload

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload` | Upload a medical file (multipart/form-data). Returns the parsed record with extracted clinical data. |

### Records

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/records` | Retrieve all medical records, sorted by upload date. |
| `GET` | `/api/records/:id` | Get details for a specific record. |
| `PUT` | `/api/records/:id` | Update clinical fields (category, doctor, diagnoses, etc.). |
| `DELETE` | `/api/records/:id` | Delete a record and its associated file from disk. |
| `GET` | `/api/records/:id/file` | Download/view the original uploaded file. |

### Sharing

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/sharing/generate` | Generate a temporary, passcode-protected sharing link. |
| `GET` | `/api/sharing/:link_id` | Access shared records via a guest link (passcode via query param). |

> Full interactive documentation is available at `/docs` (Swagger UI) when the backend is running.

---

## Supported File Formats

| Format | Parser | What Gets Extracted |
|---|---|---|
| **PDF** | pdfplumber | Text, tables, dates, doctor names, diagnoses, medications, vitals |
| **PNG / JPG / HEIC** | EasyOCR | OCR text → same heuristic extraction pipeline as PDF |
| **DICOM (.dcm)** | pydicom | Patient name, modality, study date, study description, institution |

---

## App Layout

The application uses a **sidebar navigation** pattern with 5 dedicated tabs:

| Tab | What It Does |
|---|---|
| **Dashboard** | Health overview — stat cards, recent records, latest vitals snapshot |
| **Records** | Full chronological timeline with search and category filters |
| **Analytics** | Biometrics trend charts with clinical threshold reference lines |
| **Upload** | Drag-and-drop zone with supported format badges and session upload log |
| **Share** | Full-page secure link generator with record picker and expiry settings |

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/omnisage` | Database connection string. Falls back to SQLite if connection fails. |
| `UPLOAD_DIR` | `backend/uploads` | Directory where uploaded files are stored on disk. |

---

## License

This project is for educational and personal use. See [LICENSE](LICENSE) for details.
