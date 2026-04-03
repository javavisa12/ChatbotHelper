'''Project-related routes for Python Assistant.'''

import uuid
from flask import Blueprint, request, jsonify, session
from services.project_loader import load_project_files, load_uploaded_files

project = Blueprint("project", __name__)


@project.route("/api/load_project", methods=["POST"])
def load_project():
    path       = request.json.get("path", "").strip().replace('"', '')
    session_id = session.get("session_id") or str(uuid.uuid4())
    session["session_id"] = session_id

    files, err = load_project_files(path, session_id)
    if err:
        return jsonify({"error": err}), 400

    return jsonify({"message": f"Loaded {len(files)} files", "files": files})


@project.route("/api/load_files", methods=["POST"])
def load_files():
    data       = request.json or {}
    files      = data.get("files", [])
    session_id = session.get("session_id") or str(uuid.uuid4())
    session["session_id"] = session_id

    if not files:
        return jsonify({"error": "No files provided."}), 400

    names = load_uploaded_files(files, session_id)
    return jsonify({"message": f"Loaded {len(names)} files", "files": names})