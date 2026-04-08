"""Runner service for Python Assistant. Executes project code and analyzes errors using LLM."""

import subprocess
import os
import sys
from services.project_loader import get_project
from llm.chat import chat


def run_python_file(main_file: str, session_id: str):
    """
    Execute a Python file and analyze any errors using LLM.
    
    Args:
        main_file: Name of the Python file to execute
        session_id: Session identifier for project context
        
    Returns:
        Dictionary with stdout, stderr, and analysis (if error occurred)
    """
    project_code, project_path = get_project(session_id)

    if not project_path:
        return {"error": "No project loaded with a valid path."}

    full_path = os.path.join(project_path, main_file)
    if not os.path.exists(full_path):
        return {"error": f"Main file not found: {full_path}"}

    try:
        result = subprocess.run(
            [sys.executable, full_path],
            capture_output=True,
            text=True,
            timeout=30,
            check=False,
            cwd=project_path
        )

        if not result.stderr:
            return {
                "stdout": result.stdout,
                "stderr": "",
                "analysis": None,
                "status": "success"
            }

        prompt = f"""You are a Python debugging expert.

Error:
{result.stderr}

Project Code:
{project_code}

Provide analysis in this format:
- Root cause (1 short line)
- Fix (1 short line)
- Corrected code (production-ready)

Rules:
- Minimal explanation
- Clean executable code
- Focus on the most likely issue"""

        analysis = chat(prompt)
        
        return {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "analysis": analysis,
            "status": "error"
        }

    except subprocess.TimeoutExpired:
        return {
            "error": "Execution timed out after 30 seconds",
            "status": "timeout"
        }
    except Exception as e:
        return {
            "error": f"Execution failed: {str(e)}",
            "status": "failed"
        }


def run_python_with_args(main_file: str, session_id: str, args: list = None):
    """
    Execute a Python file with command-line arguments.
    
    Args:
        main_file: Name of the Python file to execute
        session_id: Session identifier for project context
        args: List of command-line arguments to pass
        
    Returns:
        Dictionary with stdout, stderr, and analysis (if error occurred)
    """
    project_code, project_path = get_project(session_id)

    if not project_path:
        return {"error": "No project loaded with a valid path."}

    full_path = os.path.join(project_path, main_file)
    if not os.path.exists(full_path):
        return {"error": f"Main file not found: {full_path}"}

    try:
        command = [sys.executable, full_path]
        if args:
            command.extend(args)

        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=30,
            check=False,
            cwd=project_path
        )

        if not result.stderr:
            return {
                "stdout": result.stdout,
                "stderr": "",
                "analysis": None,
                "status": "success"
            }

        prompt = f"""You are a Python debugging expert.

Error:
{result.stderr}

Project Code:
{project_code}

Command: python {main_file} {' '.join(args) if args else ''}

Provide analysis in this format:
- Root cause (1 short line)
- Fix (1 short line)
- Corrected code (production-ready)

Rules:
- Minimal explanation
- Clean executable code"""

        analysis = chat(prompt)
        
        return {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "analysis": analysis,
            "status": "error"
        }

    except subprocess.TimeoutExpired:
        return {
            "error": "Execution timed out after 30 seconds",
            "status": "timeout"
        }
    except Exception as e:
        return {
            "error": f"Execution failed: {str(e)}",
            "status": "failed"
        }
