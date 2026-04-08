"""Project-related routes for Python Assistant."""

import uuid
from flask import Blueprint, request, jsonify, session
from services.project_loader import load_project_files, load_uploaded_files

project = Blueprint("project", __name__)


@project.route("/api/load_project", methods=["POST"])
def load_project_route():
    """
    Load a Python project from a directory.
    
    Expected JSON:
    {
        "path": "/path/to/project"
    }
    """
    path = request.json.get("path", "").strip().replace('"', '')
    
    # Get or create session ID
    if "session_id" not in session:
        session["session_id"] = str(uuid.uuid4())
    
    session_id = session["session_id"]
    print(f"DEBUG: Files loaded for session:{session_id}")

    files, err = load_project_files(path, session_id)
    if err:
        return jsonify({"error": err}), 400

    return jsonify({
        "status": "success",
        "message": f"Loaded {len(files)} files",
        "files": files,
        "session_id": session_id
    }), 200


@project.route("/api/load_files", methods=["POST"])
def load_files():
    """
    Load uploaded Python files.
    
    Expected JSON:
    {
        "files": [
            {"name": "main.py", "content": "print('hello')"},
            {"name": "utils.py", "content": "def helper(): pass"}
        ]
    }
    """
    data = request.json or {}
    files = data.get("files", [])
    
    # Get or create session ID
    if "session_id" not in session:
        session["session_id"] = str(uuid.uuid4())
    
    session_id = session["session_id"]

    if not files:
        return jsonify({"error": "No files provided."}), 400

    names, err = load_uploaded_files(files, session_id)
    
    if err:
        return jsonify({"error": err}), 400
    
    return jsonify({
        "status": "success",
        "message": f"Loaded {len(names)} files",
        "files": names,
        "session_id": session_id
    }), 200


@project.route("/api/session_info", methods=["GET"])
def session_info():
    """
    Get information about the current session.
    
    Returns:
        Session ID and loaded files
    """
    session_id = session.get("session_id")
    
    if not session_id:
        return jsonify({"error": "No active session"}), 400
    
    # Import here to avoid circular import
    from services.project_loader import get_session_file_list
    
    files = get_session_file_list(session_id)
    
    return jsonify({
        "session_id": session_id,
        "files": files
    }), 200


@project.route("/api/session/clear", methods=["POST"])
def clear_session():
    """
    Clear the current session.
    """
    session_id = session.get("session_id")
    
    if not session_id:
        return jsonify({"error": "No active session"}), 400
    
    # Import here to avoid circular import
    from services.project_loader import delete_session
    
    delete_session(session_id)
    session.clear()
    
    return jsonify({
        "status": "success",
        "message": "Session cleared"
    }), 200
