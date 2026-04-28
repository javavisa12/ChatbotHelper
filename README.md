"""Launcher for the LLM Loader service."""
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

# Add llm_loader to path so model_config imports cleanly
sys.path.insert(0, str(Path(__file__).parent / "llm_loader"))
import model_config as cfg  # noqa: E402

cmd = [
    sys.executable, "-m", "uvicorn", "server:app",
    "--host", cfg.LLM_HOST,
    "--port", str(cfg.LLM_PORT),
    "--workers", "1",
]

print("\n" + "=" * 50)
print("  LLM Loader — StarCoder2")
print("=" * 50)
print(f"  Model  : {cfg.MODEL_PATH}")
print(f"  Host   : {cfg.LLM_HOST}:{cfg.LLM_PORT}")
print(f"  Ctx    : {cfg.N_CTX}  Threads: {cfg.N_THREADS}")
print("=" * 50 + "\n")

proc = subprocess.Popen(cmd, cwd=str(Path(__file__).parent / "llm_loader"))

# Wait for health
url = f"http://localhost:{cfg.LLM_PORT}/health"
print(f"Waiting for loader at {url} ...")
for _ in range(60):
    try:
        with urllib.request.urlopen(url, timeout=3) as r:
            if r.status == 200:
                print(f"\n✅ LLM Loader READY — http://localhost:{cfg.LLM_PORT}")
                print("   Now start Flask:  python app.py\n")
                break
    except Exception:
        time.sleep(3)
else:
    print("⚠️  Loader did not start in time. Check logs above.")
    proc.terminate()
    sys.exit(1)

try:
    proc.wait()
except KeyboardInterrupt:
    print("\nShutting down...")
    proc.terminate()
    proc.wait()
