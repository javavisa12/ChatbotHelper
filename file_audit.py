"""
Writes file operation events to audit logs (append-only JSONL).
"""

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

from config import FILE_AUDIT_DIR, FILE_AUDIT_FORMAT
from .constants import logger

_TZ_MYT = timezone(timedelta(hours=8))


def write_file_audit(username: str, action: str, file: str) -> None:
    """
    Append file operation log entry.
    Uses JSONL format for performance.
    """

    try:
        now = datetime.now(_TZ_MYT)

        if FILE_AUDIT_FORMAT == "month":
            period = now.strftime("%Y%m")
        else:
            period = now.strftime("%Y%m%d")

        FILE_AUDIT_DIR.mkdir(parents=True, exist_ok=True)

        audit_file = FILE_AUDIT_DIR / f"file_audit_{period}.jsonl"

        entry = {
            "timestamp": now.isoformat(),
            "username": username,
            "action": action,
            "file": file,
        }

        # Append instead of overwrite
        with open(audit_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    except Exception as exc:
        logger.error("File audit failed: %s", exc)
