'''AI-related routes for Python Assistant.'''

from flask import Blueprint, request, jsonify, session
from llm.chat import chat
from services.project_loader import get_project

ai = Blueprint("ai", __name__)


@ai.route("/api/ask", methods=["POST"])
def ask():
    '''Ask a question about attached files/project.'''

    try:
        # Get request data safely
        data = request.get_json() or {}
        question = data.get("question", "").strip()
        
        # Also check for 'message' field (for compatibility)
        if not question:
            question = data.get("message", "").strip()

        if not question:
            return jsonify({"error": "No question provided."}), 400

        # Try to get session files, but don't require them
        session_id = session.get("session_id")
        code = ""
        if session_id:
            code, _ = get_project(session_id)
        
        # If files are attached inline in the question, they're already there
        # Check if the question contains attached file markers
        has_attachments = "📎" in question or "FILE:" in question

        # Build prompt based on whether we have code context
        if code or has_attachments:
            prompt = f"""
You are a senior Python engineer.
Answer based on the attached files.

Rules:
- 1-2 sentence explanation
- Clean code
- Code in code block

Project/Attached files:
{code if code else '(Files included inline in the question)'}

Question:
{question}
"""
        else:
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

        # LLM call
        result = chat(prompt)

        # Frontend expects 'response' or 'answer'
        return jsonify({"response": result, "answer": result})

    except Exception as e:
        print("ERROR in /ask:", e)
        return jsonify({"error": str(e)}), 500
