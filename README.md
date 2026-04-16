"""
Resolves canonical audit directory paths.
"""

from pathlib import Path
from common.utils.config import CHAT_AUDIT_DIR
from common.utils.helpers import HELPER_CODES


def audit_dir_for(helper_code: str, username: str | None = None) -> Path:
    """
    Returns the directory path for storing chat audit logs.
    """

    helper_name = HELPER_CODES.get(helper_code, f"helper-{helper_code}")

    base = CHAT_AUDIT_DIR / helper_name

    if username:
        return base / username

    return base
