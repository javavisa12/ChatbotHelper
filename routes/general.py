from flask import Blueprint, jsonify, request, render_template
from config import DEFAULT_MODEL, MODELS
from llm.chat import chat

general = Blueprint("general", __name__)

@general.route("/")
def index():
    # Removed request.json access because GET requests have no body
    return render_template("index.html")

@general.route("/api/status", methods=["GET"])
def status():
    # Corrected variable to DEFAULT_MODEL from config.py
    return jsonify({
        "status": "online",
        "model": DEFAULT_MODEL
    })

@general.route("/api/models", methods=["GET"])
def get_models():
    return jsonify({
        "models": list(MODELS.keys())
    })

@general.route("/api/python_qa", methods=["POST"])
def python_qa():
    data = request.json or {}

    messages = data.get("messages")  # ✅ NEW
    question = data.get("question", "").strip()

    if not question and not messages:
        return jsonify({"error": "Question is empty."}), 400

    # ✅ If messages exist → use memory mode
    if messages:
        # inject system prompt at the top
        system_prompt = {
            "role": "system",
            "content": (
                "You are a senior Python engineer.\n"
                "Answer clearly and concisely.\n"
                "Rules:\n"
                "- Short explanation (1-2 sentences)\n"
                "- Provide working code\n"
                "- Clean code"
            )
        }

        # ensure system prompt is always first
        messages[0] = system_prompt

        return jsonify({"response": chat(messages)})

    # ✅ fallback (no memory, old behavior)
    prompt = f"""
You are a senior Python engineer.
Answer clearly and concisely.
Rules:
- Short explanation (1-2 sentences)
- Provide working code
- Clean code

Question:
{question}
"""
    return jsonify({"response": chat(prompt)})