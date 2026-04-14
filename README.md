"""
Defines shared constants for audit utilities.
It centralizes logger and project-root references used by audit modules.
It is needed to standardize audit path and logging setup.
"""

from __future__ import annotations

import logging

logger = logging.getLogger("PBAI.audit")
"""
Writes file operation events to system-wide audit JSON files.
It records upload, delete, and assign actions with timestamp, username, and filename.
It is needed for compliance traceability of document lifecycle changes.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path

from common.utils.config import AUDIT_LOG_DIR, FILE_AUDIT_FORMAT

logger = logging.getLogger("PBAI.file_audit")

_TZ_MYT = timezone(timedelta(hours=8))


def write_file_audit(username: str, action: str, file: str) -> None:
    """Append a file operation entry to the system-wide audit log.

    The audit file is rotated by day (``YYYY-MM-DD``) or month (``YYYY-MM``)
    depending on ``PBAI_FILE_AUDIT_FORMAT``.  When the current-period file
    already exists the entry is appended; otherwise a new file is created.

    Args:
        username: Identity of the actor performing the operation.
        action:   Operation type — ``"upload"``, ``"delete"``, or ``"assign"``.
        file:     Filename (basename) of the document affected.
    """
    try:
        now = datetime.now(_TZ_MYT)
        if FILE_AUDIT_FORMAT == "month":
            period = now.strftime("%Y%m")
        else:
            period = now.strftime("%Y%m%d")

        audit_dir = Path(AUDIT_LOG_DIR) / "file_operations"
        audit_dir.mkdir(parents=True, exist_ok=True)

        audit_file = audit_dir / f"file_audit_{period}.json"
        entry = {
            "timestamp": now.isoformat(),
            "username": username,
            "action": action,
            "file": file,
        }

        if audit_file.exists():
            with open(audit_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            if not isinstance(data, list):
                data = []
            data.append(entry)
        else:
            data = [entry]

        with open(audit_file, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    except Exception as exc:
        logger.error("Failed to write file audit log: %s", exc)
        """
Resolves canonical audit directory paths.
It maps helper codes and usernames to deterministic audit storage locations.
It is needed to keep audit read and write paths aligned.
"""

from __future__ import annotations

from pathlib import Path

from common.utils.config import AUDIT_LOG_DIR
from common.utils.helpers import HELPER_CODES


def audit_dir_for(helper_code: str, username: str | None = None) -> Path:
    """Canonical audit log path resolver.

    Single source of truth for audit log directories used by both the write
    path (writer.py) and the read path (admin_sessions.py).

    Args:
        helper_code: HELPER_CODES key, e.g. "01" for "policy_helper".
        username: When supplied, appends the user subdirectory.

    Returns:
        Resolved Path for the audit log directory.
    """
    helper_name = HELPER_CODES.get(helper_code, f"helper-{helper_code}")
    base = Path(AUDIT_LOG_DIR) / helper_name / "audit_logs"
    return base / username if username else base

    """
Writes chat interactions to per-session audit JSON files.
It appends user and assistant messages with timestamps, sources, and metadata.
It is needed for traceability and post-session review.
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone

from .constants import logger
from .resolver import audit_dir_for


def write_audit_log(
    code: str,
    username: str,
    session_id: str,
    question: str,
    answer: str,
    sources: list,
    meta: dict,
) -> None:
    log_dir = audit_dir_for(code, username)
    log_dir.mkdir(parents=True, exist_ok=True)

    log_file = log_dir / f"{session_id}.json"

    now = datetime.now(timezone(timedelta(hours=8))).isoformat()
    user_msg      = {"role": "user",      "content": question, "timestamp": now}
    assistant_msg = {"role": "assistant", "content": answer.strip(),   "timestamp": now,
                     "sources": sources,
                     "meta": {
                         "confidence":  meta.get("confidence", 0.0),
                         "search_time": meta.get("search_time"),
                         "gen_time":    meta.get("gen_time"),
                         "total_time":  meta.get("total_time"),
                     }}

    try:
        if log_file.exists():
            with open(log_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            if not isinstance(data, dict):
                data = {"created_at": now, "messages": []}
            data["messages"].extend([user_msg, assistant_msg])
        else:
            data = {"created_at": now, "messages": [user_msg, assistant_msg]}

        with open(log_file, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    except Exception as exc:
        logger.error("Failed to write audit log to %s: %s", log_file, exc)
