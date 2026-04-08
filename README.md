from flask import Blueprint, jsonify, request, render_template, session
import uuid

from config import DEFAULT_MODEL
from llm.chat import chat
from llm.model import health_check

general = Blueprint("general", __name__)


@general.route("/")
def index():
    return render_template("index.html")


# ✅ FIXED: removed /api + added session init
@general.route("/api/status", methods=["GET"])
def status():
    if "session_id" not in session:
        session["session_id"] = str(uuid.uuid4())


    health = health_check()

    return jsonify({
        "status": "online",
        "model": DEFAULT_MODEL,
        "llm_loader": health.get("status"),
        "pool_total": health.get("pool_total"),
        "pool_idle": health.get("pool_idle"),
        "session_id": session["session_id"]
    })


# ✅ FIXED: renamed route + fixed response key
@general.route("/api/pyqa", methods=["POST"])
def pyqa():
    data = request.get_json() or {}
    messages = data.get("messages")
    question = data.get("question", "").strip()

    if not question and not messages:
        return jsonify({"error": "Question is empty."}), 400

    try:
        if messages:
            messages[0] = {
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
            return jsonify({"answer": chat(messages)})  # ✅ FIXED

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
        return jsonify({"answer": chat(prompt)})  # ✅ FIXED

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": str(e)}), 500
