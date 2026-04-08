from flask import Blueprint, jsonify, session
import uuid

general = Blueprint("general", __name__)

@general.route("/status", methods=["GET"])
def status():
    # ✅ create session if not exists
    if "session_id" not in session:
        session["session_id"] = str(uuid.uuid4())

    return jsonify({
        "status": "ok",
        "session_id": session["session_id"]
    })
