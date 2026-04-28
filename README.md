"""Model configuration for llama_cpp_python backend."""
import os
from pathlib import Path

# ── Path to your downloaded GGUF file ──────────────────────────────────────
MODEL_PATH = os.getenv(
    "MODEL_PATH",
    str(Path(__file__).parent.parent / "models" / "starcoder2.gguf")
)

# ── Inference settings ──────────────────────────────────────────────────────
N_CTX        = int(os.getenv("N_CTX", 4096))       # context window
N_GPU_LAYERS = int(os.getenv("N_GPU_LAYERS", 0))   # 0 = CPU only; set >0 if you have GPU
N_THREADS    = int(os.getenv("N_THREADS", 8))
MAX_TOKENS   = int(os.getenv("MAX_TOKENS", 1024))
TEMPERATURE  = float(os.getenv("TEMPERATURE", 0.1))

# ── Service settings ────────────────────────────────────────────────────────
HOST    = os.getenv("LLM_HOST", "0.0.0.0")
PORT    = int(os.getenv("LLM_PORT", 8501))
SECRET  = os.getenv("LLM_INTERNAL_SECRET", "")     # match your Flask .env
