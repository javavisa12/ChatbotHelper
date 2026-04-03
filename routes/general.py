'''General routes for Python Assistant.'''

from flask import Blueprint, jsonify, request, render_template
from config import DEFAULT_MODEL
from llm.chat import chat
from llm.model import health_check

general = Blueprint("general", __name__)


@general.route("/")
def index():
    return render_template("index.html")


@general.route("/api/status", methods=["GET"])
def status():
    health = health_check()
    return jsonify({
        "status": "online",
        "model": DEFAULT_MODEL,
        "llm_loader": health.get("status"),
        "pool_total": health.get("pool_total"),
        "pool_idle": health.get("pool_idle"),
    })


@general.route("/api/python_qa", methods=["POST"])
def python_qa():
    data = request.json or {}
    messages = data.get("messages")
    question = data.get("question", "").strip()

    if not question and not messages:
        return jsonify({"error": "Question is empty."}), 400

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
        return jsonify({"response": chat(messages)})

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