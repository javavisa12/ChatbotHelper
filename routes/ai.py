'''AI-related routes for Python Assistant.'''

from flask import Blueprint, request, jsonify, session
from llm.chat import chat
from services.project_loader import get_project

ai = Blueprint("ai", __name__)


@ai.route("/api/ask", methods=["POST"])
def ask():
    '''Ask a question about attached files/project.'''

    try:
        # ✅ Session check
        session_id = session.get("session_id")
        if not session_id:
            return jsonify({"error": "No session found."}), 400

        # ✅ Get project files
        code, _ = get_project(session_id)
        if not code:
            return jsonify({"error": "No files attached."}), 400

        # ✅ Get request data safely
        data = request.get_json() or {}
        question = data.get("question", "").strip()

        if not question:
            return jsonify({"error": "No question provided."}), 400

        # ✅ Prompt
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

        # ✅ LLM call
        result = chat(prompt)

        # ✅ Frontend expects 'response'
        return jsonify({"response": result})

    except Exception as e:
        print("ERROR in /ask:", e)
        return jsonify({"error": str(e)}), 500
