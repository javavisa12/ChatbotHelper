from flask import Blueprint, jsonify, request, render_template, session
from core.audit.chat_audit import write_audit_log
from core.audit.session_utils import generate_session_id
from config import DEFAULT_MODEL
from llm.chat import chat
from llm.model import health_check

general = Blueprint("general", __name__)


SYSTEM_PROMPT = (
    "You are a senior Python engineer.\n"
    "Answer clearly and concisely.\n\n"
    "Rules:\n"
    "- Short explanation (1-2 sentences)\n"
    "- Provide working code\n"
    "- Clean code"
)


@general.route("/")
def index():
    return render_template("index.html")


# ✅ Status route (NO UUID)
@general.route("/api/status", methods=["GET"])
def status():
    if "session_id" not in session:
        session["session_id"] = None

    health = health_check()

    return jsonify({
        "status": "online",
        "model": DEFAULT_MODEL,
        "llm_loader": health.get("status"),
        "pool_total": health.get("pool_total"),
        "pool_idle": health.get("pool_idle"),
        "session_id": session.get("session_id"),
        "project_loaded": bool(session.get("project_path")),
        "project_path": session.get("project_path")
    })


# ✅ Main chat route
@general.route("/api/pyqa", methods=["POST"])
def pyqa():
    data = request.get_json() or {}
    messages = data.get("messages")
    question = data.get("question", "").strip()

    if not question and not messages:
        return jsonify({"error": "Question is empty."}), 400

    try:
        username = session.get("username", "anonymous")

        # =========================
        # SESSION (Option 2 logic)
        # =========================
        if not session.get("session_id"):
            session["session_id"] = generate_session_id(question or "chat")

        session_id = session["session_id"]

        # =========================
        # HISTORY INIT
        # =========================
        if "history" not in session:
            session["history"] = []

        # =========================
        # CASE 1: Chat messages mode
        # =========================
        if messages:
            messages.insert(0, {
                "role": "system",
                "content": SYSTEM_PROMPT
            })
            response = chat(messages)

        # =========================
        # CASE 2: Simple question mode
        # =========================
        else:
            session["history"].append({
                "role": "user",
                "content": question
            })

            full_messages = [
                {"role": "system", "content": SYSTEM_PROMPT}
            ] + session["history"]

            response = chat(full_messages)

            session["history"].append({
                "role": "assistant",
                "content": response
            })

        # =========================
        # 🔥 AUDIT LOG
        # =========================
        write_audit_log(
            code="01",
            username=username,
            session_id=session_id,
            question=question,
            answer=response,
            sources=[],
            meta={}
        )

        return jsonify({"response": response, "answer": response})

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": str(e)}), 500
