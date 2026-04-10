from flask import Blueprint, jsonify, request, render_template, session
import uuid

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


# ✅ Status route with session init
@general.route("/api/status", methods=["GET"])
def status():
    if "session_id" not in session:
        session["session_id"] = str(uuid.uuid4())

    health = health_check()

    return jsonify({
        "status": "online",
        "model": DEFAULT_MODEL,
        "llm_loader": health.get("status"),
        "pool_total": health.get("pool_total"),
        "pool_idle": health.get("pool_idle"),
        "session_id": session["session_id"],
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
        # ✅ Ensure session exists
        if "session_id" not in session:
            session["session_id"] = str(uuid.uuid4())

        # ✅ Initialize chat history if not exists
        if "history" not in session:
            session["history"] = []

        # =========================
        # CASE 1: Chat messages mode
        # =========================
        if messages:
            # Inject system prompt WITHOUT overwriting user message
            messages.insert(0, {
                "role": "system",
                "content": SYSTEM_PROMPT
            })

            print("MESSAGES SENT:", messages)  # Debug

            response = chat(messages)

            return jsonify({"response": response})

        # =========================
        # CASE 2: Simple question mode
        # =========================
        else:
            # Store user message
            session["history"].append({
                "role": "user",
                "content": question
            })

            # Build full conversation
            full_messages = [
                {"role": "system", "content": SYSTEM_PROMPT}
            ] + session["history"]

            print("MESSAGES SENT:", full_messages)  # Debug

            response = chat(full_messages)

            # Store assistant reply
            session["history"].append({
                "role": "assistant",
                "content": response
            })

            return jsonify({"response": response})

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": str(e)}), 500
