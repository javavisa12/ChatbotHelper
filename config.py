"""App configuration for Python Assistant."""

import os
from dotenv import load_dotenv

load_dotenv()

# LLM Loader service
LLM_LOADER_URL = os.getenv("LLM_LOADER_URL", "http://llm-loader:8000")
LLM_LOADER_SECRET = os.getenv("LLM_LOADER_SECRET", "")
LLM_HELPER_ID = os.getenv("LLM_HELPER_ID", "python-assistant")

# Generation settings
MAX_TOKENS = 1000
TEMP = 0.2
DEFAULT_MODEL = "qwen"