<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-17-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Ollama-Local_AI-FF6600?style=for-the-badge&logo=ollama&logoColor=white" />
</p>

<h1 align="center">Omnisage</h1>

<p align="center">
  <strong>AI-Powered Medical Record Aggregator</strong><br />
  Upload, parse, organize, and intelligently query your complete medical history — lab reports, prescriptions, clinical notes, and DICOM imaging — powered by local AI that keeps your data private.
</p>

---

## The Problem

Medical records are scattered across hospitals, clinics, labs, and imaging centers — each with their own portal, format, and login. Patients lose track of critical health data, doctors never have the full picture, and sharing records for a second opinion means chasing down paperwork.

**Omnisage** solves this by giving patients a single, self-hosted platform to:

- **Upload anything** — PDFs, scanned images, photos of prescriptions, DICOM files
- **Auto-extract clinical data** — AI-powered parsing pulls out diagnoses, medications, vitals, dates, and physicians
- **Chat with your records** — Ask questions about your medical history using a RAG-powered AI assistant
- **Get health recommendations** — Personalized, AI-generated wellness advice based on your complete health profile
- **Semantic search** — Find relevant records using natural language queries instead of exact keyword matches
- **Visualize health trends** — Track biometrics like cholesterol, glucose, Vitamin D, and blood pressure over time
- **Share securely** — Generate temporary, passcode-protected links for clinician consultations

---

## Features

### Core Platform

| Feature | Description |
|---|---|
| **Multi-Format Ingestion** | Upload PDFs, DICOM (.dcm), PNG, JPG, and HEIC files. Each format is routed to a specialized parser. |
| **AI Document Parsing** | Extracts record dates, doctor names, diagnoses, medications with dosages, and vitals using pdfplumber + EasyOCR + regex heuristics. |
| **Interactive Dashboard** | Landing page shows health summary stats, recent records, vitals snapshot, and AI recommendations. |
| **Health Timeline** | Chronological, searchable, filterable list of all medical records with category badges and review status. |
| **Biometrics Analytics** | Recharts-powered trend line charts for Vitamin D, cholesterol, glucose, hemoglobin with clinical threshold indicators. |
| **DICOM Viewer** | Built-in browser-based viewer for medical imaging files (MRI, CT, X-ray) with window/level controls. |
| **Secure Sharing** | Generate expiring, passcode-protected links that grant read-only access to selected records. |
| **Medical Glossary** | Click any extracted term to see a plain-language patient education explanation. |
| **Record Editing** | Manually correct diagnoses, change categories, update physician names, and mark records as reviewed. |

### AI Features (Local — No Cloud APIs)

| Feature | Description |
|---|---|
| **Medical Report Summarization** | Auto-generates structured summaries with key findings, abnormal results, medications, and follow-ups. |
| **RAG Health Assistant** | Chat with your medical records. The AI retrieves relevant document chunks and generates context-aware answers with source citations. |
| **Personalized Recommendations** | Aggregates your health profile and generates categorized advice (lifestyle, exercise, diet, screening, follow-up) with confidence scores. |
| **Semantic Search** | Natural language search across all records with similarity scores, ranked results, and advanced filters. |

> **Privacy First:** All AI processing runs locally via [Ollama](https://ollama.com) — your medical data never leaves your machine.

---

## Tech Stack

### Backend

| Technology | Purpose |
|---|---|
| [FastAPI](https://fastapi.tiangolo.com/) | High-performance async Python web framework |
| [Uvicorn](https://www.uvicorn.org/) | ASGI server |
| [SQLAlchemy 2.0](https://www.sqlalchemy.org/) | ORM with PostgreSQL support (SQLite fallback) |
| [PostgreSQL 17](https://www.postgresql.org/) | Production database with AI feature tables |
| [Ollama](https://ollama.com/) | Local LLM inference server |
| [phi3:mini](https://ollama.com/library/phi3) | Microsoft's compact LLM for text generation |
| [nomic-embed-text](https://ollama.com/library/nomic-embed-text) | Text embedding model for semantic search & RAG |
| [pdfplumber](https://github.com/jsvine/pdfplumber) | PDF text and table extraction |
| [EasyOCR](https://github.com/JaidedAI/EasyOCR) | Neural network OCR for scanned documents |
| [pydicom](https://pydicom.github.io/) | DICOM metadata tag parser |

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
│   ├── main.py                  # FastAPI app entry point, CORS, startup logic
│   ├── config.py                # Environment settings (DB URL, Ollama, AI params)
│   ├── database.py              # SQLAlchemy engine + PostgreSQL/SQLite fallback
│   ├── requirements.txt         # Python dependencies
│   ├── models/
│   │   ├── record_models.py     # MedicalRecord SQLAlchemy model
│   │   ├── user_models.py       # User and SharedLink models
│   │   ├── ai_models.py         # AI tables: summaries, embeddings, chat, recommendations
│   │   └── schemas.py           # Pydantic request/response schemas
│   ├── parsers/
│   │   ├── document_parser.py   # MIME-type router → delegates to specific parsers
│   │   ├── pdf_parser.py        # PDF text/table extraction + clinical heuristics
│   │   ├── ocr_parser.py        # Image OCR via EasyOCR
│   │   └── dicom_parser.py      # DICOM metadata extraction
│   ├── routers/
│   │   ├── upload_router.py     # POST /api/upload — file ingestion + AI background tasks
│   │   ├── records_router.py    # CRUD operations for medical records
│   │   ├── sharing_router.py    # Secure link generation and access
│   │   └── ai_router.py         # All AI endpoints (chat, search, summarize, recommend)
│   └── services/
│       ├── ollama_client.py     # HTTP client for Ollama generate + embed APIs
│       ├── embedding_service.py # Text chunking + vector embedding generation
│       ├── summarization_service.py  # Medical report AI summarization
│       ├── chat_service.py      # RAG chatbot pipeline
│       ├── recommendation_service.py # Health recommendations engine
│       └── search_service.py    # Semantic similarity search
│
├── frontend/
│   ├── index.html               # HTML entry point
│   ├── package.json             # Node dependencies and scripts
│   ├── vite.config.js           # Vite build configuration
│   ├── tailwind.config.js       # Tailwind CSS theme tokens
│   └── src/
│       ├── main.jsx             # React DOM root mount
│       ├── index.css            # Global styles, design tokens, component classes
│       ├── App.jsx              # App shell — sidebar + page router
│       ├── components/
│       │   ├── Sidebar.jsx      # Fixed left navigation with 7 tabs
│       │   ├── FileUploadZone.jsx   # Drag-and-drop multi-file upload
│       │   ├── HealthTimeline.jsx   # Searchable record list
│       │   ├── VitalsChart.jsx      # Biometrics trend charts
│       │   ├── DicomViewer.jsx      # Browser-based DICOM renderer
│       │   ├── RecordDetailModal.jsx # Record viewer with AI Summary tab
│       │   └── SecureShareModal.jsx  # Share link generator
│       ├── pages/
│       │   ├── DashboardPage.jsx    # Overview + AI Recommendations
│       │   ├── RecordsPage.jsx      # Full timeline with filters
│       │   ├── AnalyticsPage.jsx    # Vitals charts + readings grid
│       │   ├── UploadPage.jsx       # Upload zone + format info
│       │   ├── SharePage.jsx        # Secure link generator
│       │   ├── ChatPage.jsx         # AI RAG chatbot
│       │   └── SearchPage.jsx       # Semantic search
│       └── services/
│           └── apiService.js    # Axios wrapper for all API calls
│
├── start.bat                    # One-click startup script (Windows)
├── stop.bat                     # Service shutdown script (Windows)
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

| Requirement | Version | Required |
|---|---|---|
| [Python](https://www.python.org/downloads/) | 3.12+ | ✅ Yes |
| [Node.js](https://nodejs.org/) | 20+ | ✅ Yes |
| [PostgreSQL](https://www.postgresql.org/download/) | 16+ | ⚡ Recommended (auto-falls back to SQLite) |
| [Ollama](https://ollama.com/) | Latest | ⚡ Required for AI features |

### 1. Clone the Repository

```bash
git clone https://github.com/AshraX12/omnisage.git
cd omnisage
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

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
npm install
```

### 4. Database Setup

#### Option A: SQLite (Zero Setup)

No configuration needed — the app auto-creates a local `omnisage.db` file.

#### Option B: PostgreSQL (Recommended)

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE omnisage;"

# Set the connection string (optional — defaults to postgres:postgres@localhost)
# Windows PowerShell:
$env:DATABASE_URL = "postgresql://postgres:yourpassword@localhost:5432/omnisage"
# macOS/Linux:
export DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/omnisage"
```

### 5. AI Setup (Ollama)

```bash
# Install Ollama from https://ollama.com, then:
ollama pull phi3:mini           # Language model (2.2 GB)
ollama pull nomic-embed-text    # Embedding model (274 MB)
```

### 6. Run the Application

#### Quick Start (Windows)

Double-click `start.bat` — it launches all services and opens the browser.

#### Manual Start

Open 3 terminals in the project root:

**Terminal 1 — Ollama:**
```bash
ollama serve
```

**Terminal 2 — Backend:**
```bash
# From project root (not backend/)
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 3 — Frontend:**
```bash
cd frontend
npm run dev
```

### 7. Open the App

| Service | URL |
|---|---|
| **Frontend (UI)** | [http://localhost:5173](http://localhost:5173) |
| **Backend API** | [http://localhost:8000](http://localhost:8000) |
| **API Docs (Swagger)** | [http://localhost:8000/docs](http://localhost:8000/docs) |
| **API Docs (ReDoc)** | [http://localhost:8000/redoc](http://localhost:8000/redoc) |

---

## Configuration

All settings are configurable via environment variables:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/omnisage` | Database connection string. Falls back to SQLite if unavailable. |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `phi3:mini` | LLM model for text generation |
| `OLLAMA_EMBED_MODEL` | `nomic-embed-text` | Model for text embeddings |
| `EMBEDDING_CHUNK_SIZE` | `500` | Characters per text chunk for embeddings |
| `EMBEDDING_CHUNK_OVERLAP` | `50` | Overlap between adjacent chunks |
| `RAG_TOP_K` | `5` | Number of similar chunks retrieved for RAG |

---

## API Reference

All endpoints are prefixed with `/api`.

### Upload & Records

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload` | Upload a medical file (multipart/form-data) |
| `GET` | `/api/records` | List all medical records |
| `GET` | `/api/records/:id` | Get a specific record |
| `PUT` | `/api/records/:id` | Update record fields |
| `DELETE` | `/api/records/:id` | Delete a record |
| `GET` | `/api/records/:id/file` | Download the original file |

### Sharing

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/sharing/generate` | Generate a temporary sharing link |
| `GET` | `/api/sharing/:link_id` | Access shared records via link |

### AI Features

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/summarize/:id` | Generate AI summary for a record |
| `GET` | `/api/ai/summary/:id` | Get existing summary |
| `POST` | `/api/ai/chat` | Send a message to the RAG chatbot |
| `GET` | `/api/ai/chat/conversations` | List chat conversations |
| `GET` | `/api/ai/chat/conversations/:id` | Get conversation with messages |
| `DELETE` | `/api/ai/chat/conversations/:id` | Delete a conversation |
| `POST` | `/api/ai/search` | Semantic search across records |
| `GET` | `/api/ai/recommendations` | Get health recommendations |
| `POST` | `/api/ai/recommendations/generate` | Regenerate recommendations |

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

The application uses a **sidebar navigation** pattern with 7 dedicated tabs:

| Tab | What It Does |
|---|---|
| **Dashboard** | Health overview — stat cards, recent records, vitals snapshot, AI recommendations |
| **Search** | Semantic search with natural language queries and advanced filters |
| **Records** | Full chronological timeline with search and category filters |
| **Analytics** | Biometrics trend charts with clinical threshold reference lines |
| **Upload** | Drag-and-drop zone with supported format badges and session log |
| **Share** | Secure link generator with record picker and expiry settings |
| **AI Chat** | RAG chatbot — ask questions about your medical history |

---

## Hardware Requirements

| Component | Minimum | Recommended |
|---|---|---|
| **RAM** | 8 GB | 16 GB |
| **GPU VRAM** | Not required | 4+ GB (faster AI inference) |
| **Disk Space** | ~5 GB (models + dependencies) | 10+ GB |
| **CPU** | Any modern x64 | Multi-core for concurrent AI tasks |

---

## License

This project is for educational and personal use. See [LICENSE](LICENSE) for details.
