"""
Configuration Module for Omnisage Medical Record Aggregator.

This module parses environment variables and sets up application configuration settings,
including database connections, directory paths, and cross-origin resource sharing (CORS) details.
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
            "http://127.0.0.1:5173",
            "http://localhost:3000",
        ]

        # Directories
        self.UPLOAD_DIR: str = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "uploads"
        )


# Initialize settings instance
settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
