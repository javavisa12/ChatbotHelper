"""
Writes chat interactions to per-session audit logs.
"""

import json
from datetime import datetime, timedelta, timezone

from .constants import logger
from .resolver import audit_dir_for

_TZ_MYT = timezone(timedelta(hours=8))


def write_audit_log(
    code: str,
    username: str,
    session_id: str,
    question: str,
    answer: str,
) -> None:
    """
    Append chat messages to a session log file.
    """
    try:
        log_dir = audit_dir_for(code, username)
        log_dir.mkdir(parents=True, exist_ok=True)

        log_file = log_dir / f"{session_id}.json"

        now = datetime.now(_TZ_MYT).isoformat()

        user_msg = {
            "role": "user",
            "content": question,
            "timestamp": now,
        }

        assistant_msg = {
            "role": "assistant",
            "content": answer.strip(),
            "timestamp": now,
        }

        # Load existing or create new
        if log_file.exists():
            with open(log_file, "r", encoding="utf-8") as f:
                data = json.load(f)

            if not isinstance(data, dict):
                data = {"created_at": now, "messages": []}
        else:
            data = {"created_at": now, "messages": []}

        data["messages"].extend([user_msg, assistant_msg])

        with open(log_file, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    except Exception as exc:
        logger.error("Chat audit failed (%s): %s", session_id, exc)
