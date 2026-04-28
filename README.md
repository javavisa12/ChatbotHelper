"""Model configuration for llama_cpp_python backend."""
import os
from pathlib import Path

# ── Path to your downloaded GGUF file ──────────────────────────────────────
MODEL_PATH = os.getenv(
    "MODEL_PATH",
    str(Path(__file__).parent.parent / "app" / "models" / "starcoder2-15b-Q8_0 copy.gguf")
)

# ── Inference settings ──────────────────────────────────────────────────────
N_CTX        = int(os.getenv("N_CTX", 2048))       # context window
N_GPU_LAYERS = int(os.getenv("N_GPU_LAYERS", 0))   # 0 = CPU only; set >0 if you have GPU
N_THREADS    = int(os.getenv("N_THREADS", 32))
MAX_TOKENS   = int(os.getenv("MAX_TOKENS", 1024))
TEMPERATURE  = float(os.getenv("TEMPERATURE", 0.2))

# ── Service settings ────────────────────────────────────────────────────────
HOST    = os.getenv("LLM_HOST", "0.0.0.0")
PORT    = int(os.getenv("LLM_PORT", 8505))
SECRET  = os.getenv("LLM_INTERNAL_SECRET", "")     
