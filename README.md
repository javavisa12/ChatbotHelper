import os
from flask import Blueprint, request, jsonify, session

from core.audit.file_audit import write_file_audit
from config import CHAT_UPLOAD_DIR

upload = Blueprint("upload", __name__)


@upload.route("/api/upload", methods=["POST"])
def upload_file():
    file = request.files.get("file")

    if not file:
        return jsonify({"error": "No file provided"}), 400

    username = session.get("username", "anonymous")
    session_id = session.get("session_id")

    if not session_id:
        return jsonify({"error": "No active session"}), 400

    # ✅ use config-based path
    upload_folder = CHAT_UPLOAD_DIR / session_id
    upload_folder.mkdir(parents=True, exist_ok=True)

    safe_filename = file.filename.replace("/", "_").replace("\\", "_")
    filepath = upload_folder / safe_filename

    file.save(filepath)

    # ✅ audit
    write_file_audit(username, "upload", str(filepath))

    return jsonify({
        "message": "File uploaded successfully",
        "filename": safe_filename,
        "path": str(filepath)
    })
