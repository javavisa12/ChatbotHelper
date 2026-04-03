'''AI-related routes for Python Assistant.'''

from flask import Blueprint, request, jsonify, session
from llm.chat import chat
from services.project_loader import get_project
from services.runner import run_python_file

ai = Blueprint("ai", __name__)


def get_code_or_error():
    session_id = session.get("session_id")
    if not session_id:
        return None, None, (jsonify({"error": "No session found."}), 400)
    code, _ = get_project(session_id)
    if not code:
        return None, None, (jsonify({"error": "No project loaded."}), 400)
    return code, session_id, None


@ai.route("/api/ask", methods=["POST"])
def ask():
    code, _, err = get_code_or_error()
    if err:
        return err

    question = request.json.get("question", "").strip()
    if not question:
        return jsonify({"error": "No question provided."}), 400

    prompt = f"""
You are a senior Python engineer.
Answer based on the project.
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


@ai.route("/api/analyze", methods=["POST"])
def analyze():
    code, _, err = get_code_or_error()
    if err:
        return err

    prompt = f"""
Analyze project:
- Summary
- Bugs
- Performance
- Improvements

Project:
{code}
"""
    return jsonify({"response": chat(prompt)})


@ai.route("/api/review", methods=["POST"])
def review():
    code, _, err = get_code_or_error()
    if err:
        return err

    prompt = f"""
Review project:
- Readability
- Structure
- Errors
- Security

Project:
{code}
"""
    return jsonify({"response": chat(prompt)})


@ai.route("/api/refactor", methods=["POST"])
def refactor():
    code, _, err = get_code_or_error()
    if err:
        return err

    focus = request.json.get("focus", "")
    prompt = f"""
Refactor project.
Focus: {focus}
Provide before/after code.

Project:
{code}
"""
    return jsonify({"response": chat(prompt)})


@ai.route("/api/run", methods=["POST"])
def run():
    session_id = session.get("session_id")
    if not session_id:
        return jsonify({"error": "No session found."}), 400
    main_file = request.json.get("main_file", "")
    return jsonify(run_python_file(main_file, session_id))