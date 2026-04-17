
"""
Resolves canonical audit directory paths.
"""

from pathlib import Path
from config import CHAT_AUDIT_DIR


def audit_dir_for(helper_code: str, username: str | None = None) -> Path:
    """
    Returns the directory path for storing chat audit logs.
    Ignores helper_code and username – stores directly under CHAT_AUDIT_DIR.
    """
    return CHAT_AUDIT_DIR

