"""
Configuration Module for Omnisage Medical Record Aggregator.

This module parses environment variables and sets up application configuration settings,
including database connections, directory paths, CORS details, and AI/Ollama settings.
"""

import os


class Settings:
    """
    Application settings containing configurations parsed from environment variables.
    """
    def __init__(self):
        """
        Initializes settings by reading values from the system environment.
        """
        self.DEBUG: bool = True
        self.PROJECT_NAME: str = "Omnisage Medical Record Aggregator"

        # Database URL: defaults to a local PostgreSQL instance
        self.DATABASE_URL: str = os.getenv(
            "DATABASE_URL", 
            "postgresql://postgres:postgres@localhost:5432/omnisage"
        )

        # Allowed CORS Origins
        self.CORS_ORIGINS: list[str] = [
            "http://localhost:5173",  # Vite default React dev port
            "http://localhost:5174",  # Vite fallback port
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://localhost:3000",
        ]

        # Directories
        self.UPLOAD_DIR: str = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "uploads"
        )

        # ── Ollama AI Settings ──
        self.OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "phi3:mini")
        self.OLLAMA_EMBED_MODEL: str = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")

        # ── Embedding / RAG Settings ──
        self.EMBEDDING_CHUNK_SIZE: int = int(os.getenv("EMBEDDING_CHUNK_SIZE", "500"))
        self.EMBEDDING_CHUNK_OVERLAP: int = int(os.getenv("EMBEDDING_CHUNK_OVERLAP", "50"))
        self.RAG_TOP_K: int = int(os.getenv("RAG_TOP_K", "5"))


# Initialize settings instance
settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
