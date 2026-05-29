"""
Main Entrypoint for Omnisage Medical Record Aggregator.

This module initializes the FastAPI web application, configures cross-origin resource
sharing (CORS), mounts routers (uploads, records, and sharing), and creates the database
schema and seed patient data on startup.
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.database import engine, Base, SessionLocal
from backend.models import User
from backend.routers import upload_router, records_router, sharing_router

# Initialize database schemas
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="A centralized personal health record portal aggregating PDFs, images, and DICOM imaging.",
    version="1.0.0",
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
    FastAPI startup event listener. Automatically seeds a default user account
    (ID = 1) in the database if it doesn't already exist.
    """
    db = SessionLocal()
    try:
        default_user = db.query(User).filter(User.id == 1).first()
        if not default_user:
            # Seed default patient account
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

if __name__ == "__main__":
    # Start ASGI server
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
