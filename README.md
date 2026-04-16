import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ================= LLM =================
LLM_LOADER_URL = os.getenv("LLM_LOADER_URL", "http://llm-loader:8501")
LLM_LOADER_SECRET = os.getenv("LLM_LOADER_SECRET", "")
LLM_HELPER_ID = os.getenv("LLM_HELPER_ID", "python-assistant")

MAX_TOKENS = 512
TEMP = 0.2
DEFAULT_MODEL = "qwen"

# ================= STORAGE =================
STORAGE_ROOT = Path(os.getenv("STORAGE_ROOT", "./storage")).resolve()

AUDIT_ROOT = STORAGE_ROOT / "audit"
UPLOAD_ROOT = STORAGE_ROOT / "uploads"
TEMP_ROOT = STORAGE_ROOT / "temp"

FILE_AUDIT_DIR = AUDIT_ROOT / "file_operations"
CHAT_AUDIT_DIR = AUDIT_ROOT / "chat_sessions"

# 🔥 IMPORTANT: use config path (NO HARDCODE)
CHAT_UPLOAD_DIR = STORAGE_ROOT / "chat_uploads"

FILE_AUDIT_FORMAT = os.getenv("PBAI_FILE_AUDIT_FORMAT", "day")


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


if __name__ == "__main__":
    ensure_storage_dirs()
    print("✅ Storage initialized at:", STORAGE_ROOT)
