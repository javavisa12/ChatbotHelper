"""
test_model_server.py
--------------------
Standalone Flask test server for StarCoder2-15B (llama.cpp)
Runs on port 8001 — completely separate from your chatbot on port 8000.

Usage:
    python test_model_server.py
"""

from flask import Flask, request, jsonify
from llama_cpp import Llama
import time

# ── Load Model ────────────────────────────────────────────────────────────────
MODEL_PATH = "app/models/starcoder2-15b-Q8_0.gguf"

print(f"\n🔧 Loading model: {MODEL_PATH} ...")

llm = Llama(
    model_path=MODEL_PATH,
    n_ctx=4096,
    n_gpu_layers=-1,   # -1 = use GPU if available, 0 = CPU only
    verbose=False,
)

print("✅ Model loaded!\n")

# ── Flask App ─────────────────────────────────────────────────────────────────
app = Flask(__name__)

# Default generation settings
TEMPERATURE = 0.2
MAX_TOKENS  = 1000


@app.route("/", methods=["GET"])
def root():
    return jsonify({
        "status": "running",
        "model": MODEL_PATH,
        "port": 8001,
        "note": "Test server — your chatbot on port 8000 is untouched."
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/chat", methods=["POST"])
def chat():
    """
    Body (JSON):
        prompt       : str   — required
        temperature  : float — optional (default 0.2)
        max_tokens   : int   — optional (default 1000)
        stop         : list  — optional stop sequences
    """
    data = request.get_json()

    if not data or not data.get("prompt", "").strip():
        return jsonify({"error": "prompt is required"}), 400

    prompt      = data["prompt"]
    temperature = data.get("temperature", TEMPERATURE)
    max_tokens  = data.get("max_tokens", MAX_TOKENS)
    stop        = data.get("stop", [])

    try:
        start  = time.time()
        output = llm(
            prompt,
            max_tokens=max_tokens,
            temperature=temperature,
            stop=stop,
            echo=False,
        )
        elapsed = round(time.time() - start, 3)

        return jsonify({
            "response":        output["choices"][0]["text"].strip(),
            "tokens_used":     output["usage"]["total_tokens"],
            "elapsed_seconds": elapsed,
            "model":           MODEL_PATH,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/complete", methods=["POST"])
def complete():
    """
    Code completion endpoint — ideal for StarCoder2.
    Wraps your code snippet in the StarCoder2 FIM (fill-in-middle) format.

    Body (JSON):
        prefix : str — code before the cursor
        suffix : str — code after the cursor (optional)
    """
    data   = request.get_json()
    prefix = data.get("prefix", "")
    suffix = data.get("suffix", "")

    if not prefix.strip():
        return jsonify({"error": "prefix is required"}), 400

    # StarCoder2 FIM format
    prompt = f"<fim_prefix>{prefix}<fim_suffix>{suffix}<fim_middle>"

    try:
        start  = time.time()
        output = llm(
            prompt,
            max_tokens=data.get("max_tokens", MAX_TOKENS),
            temperature=data.get("temperature", TEMPERATURE),
            stop=["<fim_pad>", "<|endoftext|>"],
            echo=False,
        )
        elapsed = round(time.time() - start, 3)

        return jsonify({
            "completion":      output["choices"][0]["text"].strip(),
            "tokens_used":     output["usage"]["total_tokens"],
            "elapsed_seconds": elapsed,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Run ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("🚀 Test server running on http://localhost:8001")
    print("   GET  /health")
    print("   POST /chat       — raw prompt")
    print("   POST /complete   — StarCoder2 FIM code completion\n")
    app.run(host="0.0.0.0", port=8001, debug=False)
