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
    question = data.get("question", "").strip()
    
    if not question:
        return jsonify({"error": "Question is empty."}), 400

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