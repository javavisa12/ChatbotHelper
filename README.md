"""
App configuration for Python Assistant.
Includes LLM settings + storage/audit configuration.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ============================================================

# 🔹 LLM LOADER CONFIG (UNCHANGED)

# ============================================================

LLM_LOADER_URL = os.getenv("LLM_LOADER_URL", "http://llm-loader:8501")
LLM_LOADER_SECRET = os.getenv("LLM_LOADER_SECRET", "")
LLM_HELPER_ID = os.getenv("LLM_HELPER_ID", "python-assistant")

# ============================================================

# 🔹 GENERATION SETTINGS (UNCHANGED)

# ============================================================

MAX_TOKENS = 512
TEMP = 0.2
DEFAULT_MODEL = "qwen"

# ============================================================

# 🔹 STORAGE ROOT (NEW)

# ============================================================

# Can override with env:

# export STORAGE_ROOT=/var/app/storage

STORAGE_ROOT = Path(os.getenv("STORAGE_ROOT", "./storage")).resolve()

# ============================================================

# 🔹 DIRECTORY STRUCTURE (NEW)

# ============================================================

# Main folders

AUDIT_ROOT   = STORAGE_ROOT / "audit"
UPLOAD_ROOT  = STORAGE_ROOT / "uploads"
TEMP_ROOT    = STORAGE_ROOT / "temp"

# Audit subfolders

FILE_AUDIT_DIR = AUDIT_ROOT / "file_operations"
CHAT_AUDIT_DIR = AUDIT_ROOT / "chat_sessions"

# ============================================================

# 🔹 AUDIT SETTINGS (NEW)

# ============================================================

# "day" → file_audit_20260415.jsonl

# "month" → file_audit_202604.jsonl

FILE_AUDIT_FORMAT = os.getenv("PBAI_FILE_AUDIT_FORMAT", "day")

# ============================================================

# 🔹 AUTO CREATE STORAGE DIRECTORIES (NEW)

# ============================================================

def ensure_storage_dirs():
"""
Ensure all required directories exist.
Call this once when app starts.
"""
dirs = [
STORAGE_ROOT,
AUDIT_ROOT,
FILE_AUDIT_DIR,
CHAT_AUDIT_DIR,
UPLOAD_ROOT,
TEMP_ROOT,
]

```
for d in dirs:
    d.mkdir(parents=True, exist_ok=True)
```

# ============================================================

# 🔹 DEBUG (OPTIONAL)

# ============================================================

if **name** == "**main**":
ensure_storage_dirs()
print("✅ Storage initialized at:", STORAGE_ROOT)
