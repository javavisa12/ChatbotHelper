'''AI-related routes for Python Assistant.'''

from flask import Blueprint, request, jsonify, session
from llm.chat import chat
from services.project_loader import get_project
from app.audit.chat_audit import write_audit_log

ai = Blueprint("ai", __name__)


@ai.route("/api/ask", methods=["POST"])
def ask():
    '''Ask a question about attached files/project.'''

    try:
        # Get request data safely
        data = request.get_json() or {}
        question = data.get("question", "").strip()

        # Compatibility with 'message'
        if not question:
            question = data.get("message", "").strip()

        if not question:
            return jsonify({"error": "No question provided."}), 400

        # Detect explanation intent
        explain_mode = any(keyword in question.lower() for keyword in [
            "explain",
            "line by line",
            "briefly explain",
            "what does this code do"
        ])

        # Get session project files if available
        session_id = session.get("session_id")
        code = ""
        if session_id:
            code, _ = get_project(session_id)

        # Detect inline attachments
        has_attachments = "📎" in question or "FILE:" in question

        # =========================
        # PROMPT BUILDING
        # =========================
        if explain_mode:
            prompt = f"""
You are a senior Python engineer.

Task:
- Explain the given code ONLY using comments inside the code.
- Do NOT give explanation outside the code.
- Do NOT change the logic.
- Add clear, concise comments (#) for each important line.

Code:
{code if code else question}
"""
        else:
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

        # =========================
        # LLM CALL
        # =========================
        result = chat(prompt)

        # =========================
        # AUDIT LOG
        # =========================
        username = session.get("username", "anonymous")
        session_id = data.get("session_id") or session.get("session_id")

        write_audit_log(
            code="01",
            username=username,
            session_id=session_id,
            question=question,
            answer=result,
            sources=[],
            meta={"mode": "explain" if explain_mode else "normal"}
        )

        # =========================
        # RESPONSE
        # =========================
        return jsonify({
            "response": result,
            "answer": result,
            "mode": "explain" if explain_mode else "normal"
        })

    except Exception as e:
        print("ERROR in /ask:", e)
        return jsonify({"error": str(e)}), 500
