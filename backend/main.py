"""
Main Entrypoint for Omnisage Medical Record Aggregator.

This module initializes the FastAPI web application, configures cross-origin resource
sharing (CORS), mounts routers (uploads, records, sharing, and AI), creates the database
schema and seed patient data on startup, and verifies Ollama connectivity.
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.database import engine, Base, SessionLocal
from backend.models import User
from backend.routers import upload_router, records_router, sharing_router
from backend.routers import ai_router

# Initialize database schemas (includes all AI tables)
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="A centralized personal health record portal aggregating PDFs, images, and DICOM imaging with AI-powered insights.",
    version="2.0.0",
    debug=settings.DEBUG
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event() -> None:
    """
    FastAPI startup event listener. Seeds the default user account and
    verifies Ollama server connectivity for AI features.
    """
    db = SessionLocal()
    try:
        # Seed default patient account
        default_user = db.query(User).filter(User.id == 1).first()
        if not default_user:
            default_user = User(
                id=1,
                email="patient@omnisage.com",
                full_name="Alex Mercer",
                hashed_password="hashed_placeholder_for_demo_purposes"
            )
            db.add(default_user)
            db.commit()
            print("Default patient seeded successfully.")
    except Exception as e:
        print(f"Error seeding default user: {str(e)}")
    finally:
        db.close()

    # Verify Ollama connectivity
    try:
        from backend.services.ollama_client import ollama_client
        if ollama_client.is_available():
            models = ollama_client.list_models()
            print(f"Ollama connected. Available models: {', '.join(models) if models else 'none'}")
            if settings.OLLAMA_MODEL not in " ".join(models):
                print(f"WARNING: Model '{settings.OLLAMA_MODEL}' not found. Pull it with: ollama pull {settings.OLLAMA_MODEL}")
            if settings.OLLAMA_EMBED_MODEL not in " ".join(models):
                print(f"WARNING: Embedding model '{settings.OLLAMA_EMBED_MODEL}' not found. Pull it with: ollama pull {settings.OLLAMA_EMBED_MODEL}")
        else:
            print("WARNING: Ollama server not reachable. AI features will be unavailable.")
            print("Start Ollama with: ollama serve")
    except Exception as e:
        print(f"WARNING: Could not check Ollama status: {e}")


@app.get("/api/health")
def health_check() -> dict[str, str]:
    """
    Simple health check endpoint to verify backend status.

    Returns:
        dict: A status confirmation message.
    """
    return {"status": "healthy", "service": settings.PROJECT_NAME}


# Mount API routers
app.include_router(upload_router.router)
app.include_router(records_router.router)
app.include_router(sharing_router.router)
app.include_router(ai_router.router)

if __name__ == "__main__":
    # Start ASGI server
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
