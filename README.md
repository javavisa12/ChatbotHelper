cat > /pythonITD/PythonAssistance/services/project_loader.py << 'EOF'
'''Project loading and management for Python Assistant.'''

import os

_sessions: dict = {}


def load_project_files(path: str, session_id: str):
    if not path or not os.path.isdir(path):
        return None, "Folder not found."

    code = ""
    loaded_files = []

    for root, dirs, files in os.walk(path):
        dirs[:] = [d for d in dirs if d not in ["venv", "__pycache__", ".git", "node_modules"]]

        for file in files:
            if file.endswith(".py"):
                full_path = os.path.join(root, file)
                try:
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        code += f"\n\nFILE: {full_path}\n{f.read()}"
                    loaded_files.append(full_path)
                except Exception:
                    pass

    if not loaded_files:
        return None, "No Python files found."

    _sessions[session_id] = {"code": code, "path": path}
    return loaded_files, None


def load_uploaded_files(files: list, session_id: str):
    code = ""
    for f in files:
        code += f"\n\nFILE: {f['name']}\n{f['content']}"

    _sessions[session_id] = {"code": code, "path": None}
    return [f["name"] for f in files]


def get_project(session_id: str):
    session = _sessions.get(session_id, {})
    return session.get("code", ""), session.get("path", None)


def clear_session(session_id: str):
    _sessions.pop(session_id, None)
EOF
