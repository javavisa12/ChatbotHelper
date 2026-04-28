"""
start_llm_loader.py
-------------------
Standalone launcher for the LLM Loader service (llama_cpp_python backend).
Run this BEFORE starting your Flask app.

Usage:
    python start_llm_loader.py
    python start_llm_loader.py --port 8501 --threads 8 --gpu-layers 0
"""

import argparse
import os
import subprocess
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

# ── Defaults (overridden by .env ) ───────────────────────────────
DEFAULT_HOST        = "0.0.0.0"
DEFAULT_PORT        = 8505
DEFAULT_WORKERS     = 1          
DEFAULT_THREADS     = 32
DEFAULT_GPU_LAYERS  = 0
DEFAULT_N_CTX       = 2048
DEFAULT_MODEL_PATH  = str(Path(__file__).parent / "app" / "models" / "starcoder2-15b-Q8_0 copy.gguf")


# ── Load .env from repo root (if present) ───────────────────────────────────
def load_dotenv(env_path: Path) -> None:
    if not env_path.exists():
        return
    print(f"[start] Loading env from: {env_path}")
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip())


# ── Wait until /health returns 200 ──────────────────────────────────────────
def wait_for_health(host: str, port: int, timeout: int = 120) -> bool:
    url = f"http://{'localhost' if host == '0.0.0.0' else host}:{port}/health"
    print(f"[start] Waiting for loader to be healthy at {url} ...")
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=3) as resp:
                if resp.status == 200:
                    return True
        except Exception:
            pass
        time.sleep(2)
    return False


# ── Validate model file ──────────────────────────────────────────────────────
def validate_model(path: str) -> None:
    p = Path(path)
    if not p.exists():
        print(f"\n[ERROR] Model file not found: {path}")
        print("  → Set MODEL_PATH in your .env or pass --model-path to this script.")
        sys.exit(1)
    size_mb = p.stat().st_size / (1024 ** 2)
    print(f"[start] Model file found: {p.name}  ({size_mb:.0f} MB)")


# ── CLI ──────────────────────────────────────────────────────────────────────
def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Start the LLM Loader service")
    p.add_argument("--host",        default=None,  help="Bind host (default: 0.0.0.0)")
    p.add_argument("--port",        type=int, default=None, help="Port (default: 8501)")
    p.add_argument("--model-path",  default=None,  help="Path to GGUF model file")
    p.add_argument("--threads",     type=int, default=None, help="CPU threads for inference")
    p.add_argument("--gpu-layers",  type=int, default=None, help="Layers offloaded to GPU (0 = CPU only)")
    p.add_argument("--n-ctx",       type=int, default=None, help="Context window size")
    p.add_argument("--no-wait",     action="store_true",    help="Don't wait for health check after launch")
    p.add_argument("--server-dir",  default=None,  help="Path to llm_loader/ directory (default: auto-detect)")
    return p.parse_args()


# ── Main ─────────────────────────────────────────────────────────────────────
def main() -> None:
    args = parse_args()

    # Load .env from repo root
    repo_root = Path(__file__).parent
    load_dotenv(repo_root / ".env")

    # Resolve final values: CLI > .env > defaults
    host        = args.host       or os.getenv("LLM_HOST",      DEFAULT_HOST)
    port        = args.port       or int(os.getenv("LLM_PORT",  DEFAULT_PORT))
    model_path  = args.model_path or os.getenv("MODEL_PATH",    DEFAULT_MODEL_PATH)
    threads     = args.threads    or int(os.getenv("N_THREADS",  DEFAULT_THREADS))
    gpu_layers  = args.gpu_layers if args.gpu_layers is not None \
                  else int(os.getenv("N_GPU_LAYERS", DEFAULT_GPU_LAYERS))
    n_ctx       = args.n_ctx      or int(os.getenv("N_CTX",      DEFAULT_N_CTX))
    secret      = os.getenv("LLM_INTERNAL_SECRET", "")

    # Locate server.py
    server_dir = Path(args.server_dir) if args.server_dir \
                 else repo_root / "llm_loader"
    server_py  = server_dir / "server.py"
    if not server_py.exists():
        print(f"[ERROR] server.py not found at: {server_py}")
        print("  → Pass --server-dir path/to/llm_loader")
        sys.exit(1)

    # Validate model
    validate_model(model_path)

    # Build environment for the child process
    env = os.environ.copy()
    env.update({
        "LLM_HOST":             host,
        "LLM_PORT":             str(port),
        "MODEL_PATH":           model_path,
        "N_THREADS":            str(threads),
        "N_GPU_LAYERS":         str(gpu_layers),
        "N_CTX":                str(n_ctx),
        "LLM_INTERNAL_SECRET":  secret,
    })

    # Build uvicorn command
    cmd = [
        sys.executable, "-m", "uvicorn", "server:app",
        "--host",    host,
        "--port",    str(port),
        "--workers", str(DEFAULT_WORKERS),
    ]

    print("\n" + "=" * 55)
    print("  LLM Loader — llama_cpp_python + StarCoder2")
    print("=" * 55)
    print(f"  Host        : {host}:{port}")
    print(f"  Model       : {model_path}")
    print(f"  Context     : {n_ctx} tokens")
    print(f"  Threads     : {threads}")
    print(f"  GPU layers  : {gpu_layers}")
    print(f"  Auth secret : {'SET' if secret else 'NOT SET (open)'}")
    print("=" * 55 + "\n")

    # Launch the service
    try:
        proc = subprocess.Popen(cmd, cwd=str(server_dir), env=env)
    except FileNotFoundError:
        print("[ERROR] uvicorn not found. Run: pip install uvicorn[standard]")
        sys.exit(1)

    if not args.no_wait:
        ok = wait_for_health(host, port)
        if ok:
            print(f"\n✅  LLM Loader is READY — http://localhost:{port}")
            print(f"    Health : http://localhost:{port}/health")
            print(f"    Infer  : POST http://localhost:{port}/generate")
            print("\n    Now start your Flask app:  python app.py\n")
        else:
            print("\n⚠️  Loader did not become healthy within 120s.")
            print("    Check logs above for model-load errors.\n")
            proc.terminate()
            sys.exit(1)

    # Hand off — keep process alive (Ctrl+C to stop)
    try:
        proc.wait()
    except KeyboardInterrupt:
        print("\n[start] Shutting down LLM Loader ...")
        proc.terminate()
        proc.wait()
        print("[start] Stopped.")


if __name__ == "__main__":
    main()
