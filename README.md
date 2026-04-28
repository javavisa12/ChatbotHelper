"""
App configuration for Python Assistant.
Includes LLM settings + storage/audit configuration.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ============================================================

# 🔹 LLM CONFIG

# ============================================================

LLM_LOADER_URL = os.getenv("LLM_LOADER_URL", "http://llm-loader:8505")
LLM_LOADER_SECRET = os.getenv("LLM_LOADER_SECRET", "")
LLM_HELPER_ID = os.getenv("LLM_HELPER_ID", "python_assistant")

MAX_TOKENS = 1025
TEMP = 0.2
DEFAULT_MODEL = "starcoder2"

# ============================================================

# 🔹 STORAGE ROOT (YOUR CUSTOM PATH)

# ============================================================

STORAGE_ROOT = Path("/pythonITD/askpbai/storage_volume/logs/PyAssist")

# ============================================================

# 🔹 DIRECTORY STRUCTURE

# ============================================================

AUDIT_ROOT = STORAGE_ROOT / "audit"
UPLOAD_ROOT = STORAGE_ROOT / "uploads"
TEMP_ROOT = STORAGE_ROOT / "temp"

FILE_AUDIT_DIR = AUDIT_ROOT / "file_operations"
CHAT_AUDIT_DIR = AUDIT_ROOT / "chat_sessions"

# Chat file uploads (per session)

CHAT_UPLOAD_DIR = STORAGE_ROOT / "Uploads"

# ============================================================

# 🔹 AUDIT SETTINGS

# ============================================================

FILE_AUDIT_FORMAT = os.getenv("PBAI_FILE_AUDIT_FORMAT", "day")

# ============================================================

# 🔹 CREATE DIRECTORIES

# ============================================================

def ensure_storage_dirs():
   
 dirs = [
  STORAGE_ROOT,
  AUDIT_ROOT,
  FILE_AUDIT_DIR,
  CHAT_AUDIT_DIR,
  CHAT_UPLOAD_DIR,
  UPLOAD_ROOT,
  TEMP_ROOT,
]

 for d in dirs:
    d.mkdir(parents=True, exist_ok=True)


# ============================================================

# 🔹 DEBUG

# ============================================================

if __name__ == "__main__":
 ensure_storage_dirs()
print("✅ Storage initialized at:", STORAGE_ROOT)
