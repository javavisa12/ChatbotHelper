'''AI-related routes for Python Assistant.'''

from flask import Blueprint, request, jsonify, session
from llm.chat import chat
from services.project_loader import get_project
from core.audit.chat_audit import write_audit_log
from core.audit.session_utils import generate_session_id

ai = Blueprint("ai", __name__)


@ai.route("/api/ask", methods=["POST"])
def ask():
    '''Ask a question about attached files/project.'''

    try:
        # =========================
        # INPUT
        # =========================
        data = request.get_json() or {}
        question = data.get("question", "").strip()

        if not question:
            question = data.get("message", "").strip()

        if not question:
            return jsonify({"error": "No question provided."}), 400

        username = session.get("username", "anonymous")

        # =========================
        # SESSION (Option 2 logic)
        # =========================
        if not session.get("session_id"):
            session["session_id"] = generate_session_id(question or "chat")

        session_id = session["session_id"]

        # =========================
        # LOAD PROJECT FILES
        # =========================
        code = ""
        if session_id:
            code, _ = get_project(session_id)

        has_attachments = "📎" in question or "FILE:" in question

        # =========================
        # PROMPT
        # =========================
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
        # LLM
        # =========================
        result = chat(prompt)

        # =========================
        # 🔥 AUDIT LOG
        # =========================
        write_audit_log(
            code="01",
            username=username,
            session_id=session_id,
            question=question,
            answer=result,
            sources=[],
            meta={}
        )

        # =========================
        # RESPONSE
        # =========================
        return jsonify({
            "response": result,
            "answer": result
        })

    except Exception as e:
        print("ERROR in /ask:", e)
        return jsonify({"error": str(e)}), 500
