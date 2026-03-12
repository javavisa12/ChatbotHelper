from flask import Flask, request, jsonify
from flask_cors import CORS
import ollama
import os
import subprocess

app = Flask(__name__)
CORS(app)

MODEL = "deepseek-coder:1.3b"

# In-memory state (per server session)
project_path = None
project_code = ""


# ── Helper ────────────────────────────────────────────────────────────────────

def chat(prompt: str) -> str:
    response = ollama.chat(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}]
    )
    return response["message"]["content"]


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/api/status", methods=["GET"])
def status():
    """Health check + current state."""
    return jsonify({
        "model": MODEL,
        "project_loaded": project_code != "",
        "project_path": project_path,
    })


@app.route("/api/load_project", methods=["POST"])
def load_project():
    """Load all .py files from a folder path on the server machine."""
    global project_path, project_code

    data = request.json or {}
    path = data.get("path", "").strip().replace('"', '')

    if not path or not os.path.isdir(path):
        return jsonify({"error": "Folder not found."}), 400

    project_path = path
    project_code = ""
    loaded_files = []

    for root, dirs, files in os.walk(path):
        dirs[:] = [d for d in dirs if d not in ["venv", "__pycache__", ".git", "node_modules"]]
        for file in files:
            if file.endswith(".py"):
                full_path = os.path.join(root, file)
                try:
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        code = f.read()
                    project_code += f"\n\nFILE: {full_path}\n{code}"
                    loaded_files.append(full_path)
                except Exception:
                    pass

    if not loaded_files:
        return jsonify({"error": "No Python files found in that folder."}), 400

    return jsonify({
        "message": f"Loaded {len(loaded_files)} Python file(s).",
        "files": loaded_files
    })


@app.route("/api/load_files", methods=["POST"])
def load_files():
    """Accept raw file contents sent from the browser (file upload)."""
    global project_path, project_code

    data = request.json or {}
    files = data.get("files", [])  # [{name, content}, ...]

    if not files:
        return jsonify({"error": "No files provided."}), 400

    project_path = None
    project_code = ""

    for f in files:
        project_code += f"\n\nFILE: {f['name']}\n{f['content']}"

    return jsonify({
        "message": f"Loaded {len(files)} file(s) from upload.",
        "files": [f["name"] for f in files]
    })


@app.route("/api/ask", methods=["POST"])
def ask_question():
    """Ask a free-form question about the loaded project."""
    if not project_code:
        return jsonify({"error": "No project loaded."}), 400

    data = request.json or {}
    question = data.get("question", "").strip()

    if not question:
        return jsonify({"error": "Question is empty."}), 400

    prompt = f"""You are a senior Python software engineer.

Below is a Python project with multiple files.

{project_code}

User question:
{question}

Answer clearly based on the project code."""

    return jsonify({"response": chat(prompt)})


@app.route("/api/analyze", methods=["POST"])
def analyze_project():
    """Full project analysis: summary, bugs, quality, performance, refactoring."""
    if not project_code:
        return jsonify({"error": "No project loaded."}), 400

    prompt = f"""You are a senior Python architect.

Analyze this entire Python project.

Provide:
1. Project summary
2. Possible bugs
3. Code quality issues
4. Performance improvements
5. Refactoring suggestions

Project code:
{project_code}"""

    return jsonify({"response": chat(prompt)})


@app.route("/api/run", methods=["POST"])
def run_main():
    """Run a specific file and auto-debug any errors with the LLM."""
    if not project_path:
        return jsonify({"error": "Project loaded from upload — cannot run files. Load via folder path instead."}), 400

    data = request.json or {}
    main_file = data.get("main_file", "").strip()

    if not main_file:
        return jsonify({"error": "No main file specified."}), 400

    full_path = os.path.join(project_path, main_file)

    if not os.path.exists(full_path):
        return jsonify({"error": f"File not found: {full_path}"}), 400

    result = subprocess.run(
        ["python", full_path],
        capture_output=True,
        text=True,
        timeout=30
    )

    if not result.stderr:
        return jsonify({
            "stdout": result.stdout,
            "stderr": "",
            "analysis": None
        })

    # There's an error — send to LLM
    prompt = f"""You are a Python debugging expert.

The following project produced an error.

Error:
{result.stderr}

Project code:
{project_code}

Explain the bug and how to fix it."""

    analysis = chat(prompt)

    return jsonify({
        "stdout": result.stdout,
        "stderr": result.stderr,
        "analysis": analysis
    })


@app.route("/api/python_qa", methods=["POST"])
def python_qa():
    """Answer any Python question — no project needed."""
    data = request.json or {}
    question = data.get("question", "").strip()

    if not question:
        return jsonify({"error": "Question is empty."}), 400

    prompt = f"""You are an expert Python tutor and engineer with deep knowledge of the language, stdlib, ecosystem, and best practices.

Answer the following Python question clearly and thoroughly. Include:
- A direct answer
- Code examples where helpful
- Any important caveats or alternatives

Question: {question}"""

    return jsonify({"response": chat(prompt)})


@app.route("/api/review", methods=["POST"])
def code_review():
    """Structured code review."""
    if not project_code:
        return jsonify({"error": "No project loaded."}), 400

    prompt = f"""You are an expert Python code reviewer.

Review this project thoroughly.

Provide structured feedback on:
1. Readability & naming conventions
2. Code structure & organisation
3. Error handling
4. Security concerns
5. Specific line-level improvements with examples

Project code:
{project_code}"""

    return jsonify({"response": chat(prompt)})


@app.route("/api/refactor", methods=["POST"])
def refactor():
    """Refactoring suggestions with before/after examples."""
    if not project_code:
        return jsonify({"error": "No project loaded."}), 400

    data = request.json or {}
    focus = data.get("focus", "").strip()

    focus_line = f"\nFocus especially on: {focus}" if focus else ""

    prompt = f"""You are a senior Python refactoring expert.

Suggest concrete refactoring improvements for this project.{focus_line}

For each suggestion, show:
- What to change and why
- Before code snippet
- After code snippet

Project code:
{project_code}"""

    return jsonify({"response": chat(prompt)})


# ── Entry ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("PyAssist backend running at http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)