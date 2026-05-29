"""
Models Package Initializer.

This module makes the models directory a package and exports User, MedicalRecord, and SharedLink.
"""

from backend.models.user_models import User, SharedLink
from backend.models.record_models import MedicalRecord

__all__ = ["User", "SharedLink", "MedicalRecord"]
