import os
from flask import Blueprint, request, jsonify, session

from core.audit.file_audit import write_file_audit
from config import UPLOAD_ROOT

upload = Blueprint("upload", __name__)


@upload.route("/api/upload", methods=["POST"])
def upload_file():
    file = request.files.get("file")

    if not file:
        return jsonify({"error": "No file provided"}), 400

    username = session.get("username", "anonymous")

    UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
    filepath = UPLOAD_ROOT / file.filename

    file.save(filepath)

    write_file_audit(username, "upload", file.filename)

    return jsonify({"message": "File uploaded successfully"})
