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
        # DETECT "EXPLAIN LINE BY LINE" REQUEST
        # =========================
        explain_line_by_line = any(phrase in question.lower() for phrase in [
            "explain line by line", "explain step by step", "line by line explanation",
            "explain each line", "comment each line", "detailed comments"
        ])

        # =========================
        # PROMPT
        # =========================
        if code or has_attachments:
            if explain_line_by_line:
                prompt = f"""
You are a senior Python engineer.
Answer based on the attached files.

The user wants a **line‑by‑line explanation** of the relevant code.
- Provide a short overall explanation (1‑2 sentences) first.
- Then show the code **with inline comments** explaining each important line inside the code block.

Project/Attached files:
{code if code else '(Files included inline in the question)'}

Question:
{question}
"""
            else:
                prompt = f"""
You are a senior Python engineer.
Answer based on the attached files.

Rules:
- 1‑2 sentence explanation
- Provide clean code (no inline comments inside the code block)
- Code must be inside a ``` code block

Project/Attached files:
{code if code else '(Files included inline in the question)'}

Question:
{question}
"""
        else:
            # No project files attached
            if explain_line_by_line:
                prompt = f"""
You are a senior Python engineer.

The user wants a **line‑by‑line explanation** of the code.
- Give a short overall answer (1‑2 sentences).
- Then show the code **with inline comments** explaining each important line inside the code block.

Question:
{question}
"""
            else:
                prompt = f"""
You are a senior Python engineer.
Answer clearly and concisely.

Rules:
- Short explanation (1‑2 sentences)
- Provide working code (no inline comments inside the code block)
- Code inside a ``` code block

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
