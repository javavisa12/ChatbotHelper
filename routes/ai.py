'''AI-related routes for Python Assistant.'''

from flask import Blueprint, request, jsonify, session
from llm.chat import chat
from services.project_loader import get_project

ai = Blueprint("ai", __name__)


@ai.route("/api/ask", methods=["POST"])
def ask():
    '''Ask a question about attached files/project.'''
    session_id = session.get("session_id")
    if not session_id:
        return jsonify({"error": "No session found."}), 400

    code, _ = get_project(session_id)
    if not code:
        return jsonify({"error": "No files attached."}), 400

    question = request.json.get("question", "").strip()
    if not question:
        return jsonify({"error": "No question provided."}), 400

    prompt = f"""
You are a senior Python engineer.
Answer based on the attached files.
Rules:
- 1-2 sentence explanation
- Clean code
- Code in code block

Project:
{code}

Question:
{question}
"""
    return jsonify({"response": chat(prompt)})


@ai.route("/api/pyqa", methods=["POST"])
def pyqa():
    '''General Python Q&A — no files needed.'''
    question = request.json.get("question", "").strip()
    if not question:
        return jsonify({"error": "No question provided."}), 400

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
