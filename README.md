"""Model configuration for llama_cpp_python backend."""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

MODEL_PATH   = os.getenv(
    "MODEL_PATH",
    str(Path(__file__).parent.parent / "app" / "models" / "starcoder2-15b-Q4_K_M.gguf")
)
LLM_HOST     = os.getenv("LLM_HOST",           "0.0.0.0")
LLM_PORT     = int(os.getenv("LLM_PORT",       8505))
N_CTX        = int(os.getenv("N_CTX",          2048))
N_THREADS    = int(os.getenv("N_THREADS",      8))
N_GPU_LAYERS = int(os.getenv("N_GPU_LAYERS",   0))
MAX_TOKENS   = int(os.getenv("MAX_TOKENS",     512))
TEMPERATURE  = float(os.getenv("TEMPERATURE", 0.1))
LLM_INTERNAL_SECRET = os.getenv("LLM_INTERNAL_SECRET", "")
