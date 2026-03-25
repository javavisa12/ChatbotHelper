from flask import Blueprint, request, jsonify
from llm.chat import chat
from services.project_loader import get_project
from services.runner import run_python_file

ai = Blueprint("ai", __name__)


@ai.route("/api/ask", methods=["POST"])
def ask():
    code, _ = get_project()
    model_name = request.json.get("model", "phi3")

    if not code:
        return jsonify({"error": "No project loaded."}), 400

    question = request.json.get("question", "").strip()

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
    code, _ = get_project()
    model_name = request.json.get("model", "phi3")

    if not code:
        return jsonify({"error": "No project loaded."}), 400

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
    code, _ = get_project()
    model_name = request.json.get("model", "phi3")

    if not code:
        return jsonify({"error": "No project loaded."}), 400

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
    code, _ = get_project()
    model_name = request.json.get("model", "phi3")

    if not code:
        return jsonify({"error": "No project loaded."}), 400

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
    main_file = request.json.get("main_file", "")
    model_name = request.json.get("model", "phi3")
    return jsonify(run_python_file(main_file))