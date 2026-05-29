"""
Database Module for Omnisage Medical Record Aggregator.

This module initializes the SQLAlchemy database engine, creates the sessionmaker,
provides the declarative base class for model mapping, and exposes a dependency
generator for retrieving active database sessions.
"""

import sys
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from backend.config import settings

# Attempt to create the engine and check the connection
try:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True
    )
    # Test connection liveness
    with engine.connect() as conn:
        pass
    print("Successfully connected to PostgreSQL database.")
except (OperationalError, Exception) as e:
    print(f"WARNING: Database connection failed (DATABASE_URL={settings.DATABASE_URL}). Details: {e}", file=sys.stderr)
    print("Falling back to local SQLite database: sqlite:///./omnisage.db", file=sys.stderr)
    engine = create_engine(
        "sqlite:///./omnisage.db",
        connect_args={"check_same_thread": False}  # Required for SQLite multi-threading
    )

# Bind sessionmaker to the resolved engine
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Declarative base class for SQLAlchemy model definitions
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency generator function that yields an active database session
    and guarantees it closes after the requesting handler executes.

    Yields:
        Session: Active database session bound to the transaction.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
