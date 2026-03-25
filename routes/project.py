from flask import Blueprint, request, jsonify
from services.project_loader import load_project_files, load_uploaded_files

project = Blueprint("project", __name__)


@project.route("/api/load_project", methods=["POST"])
def load_project():
    path = request.json.get("path", "").strip().replace('"', '')
    model_name = request.json.get("model", "phi3")

    files, err = load_project_files(path)

    if err:
        return jsonify({"error": err}), 400

    return jsonify({"message": f"Loaded {len(files)} files", "files": files})


@project.route("/api/load_files", methods=["POST"])
def load_files():
    data = request.json or {}
    files = data.get("files", [])
    model_name = request.json.get("model", "phi3")

    if not files:
        return jsonify({"error": "No files provided."}), 400

    names = load_uploaded_files(files)

    return jsonify({"message": f"Loaded {len(names)} files", "files": names})