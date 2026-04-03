'''Runner service for Python Assistant. Executes project code and analyzes errors using LLM.'''

import subprocess
import os
from services.project_loader import get_project
from llm.chat import chat


def run_python_file(main_file: str, session_id: str):
    project_code, project_path = get_project(session_id)

    if not project_path:
        return {"error": "No project loaded with a valid path."}

    full_path = os.path.join(project_path, main_file)
    if not os.path.exists(full_path):
        return {"error": f"Main file not found: {full_path}"}

    try:
        result = subprocess.run(
            ["python", full_path],
            capture_output=True,
            text=True,
            timeout=30,
            check=False
        )

        if not result.stderr:
            return {"stdout": result.stdout, "stderr": "", "analysis": None}

        prompt = f"""
You are a Python debugging expert.

Error:
{result.stderr}

Project:
{project_code}

Output:
- Root cause (1 short line)
- Fix (1 short line)
- Corrected code (production-ready)

Rules:
- Minimal explanation
- Clean executable code
"""
        return {
            "stdout":   result.stdout,
            "stderr":   result.stderr,
            "analysis": chat(prompt)
        }

    except subprocess.TimeoutExpired:
        return {"error": "Execution timed out"}
    except Exception as e:
        return {"error": str(e)}
