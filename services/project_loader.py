"""Project Loader Service for Python Assistant.
Manages file uploads, project loading, and session-based code storage.
"""

import os
import json
from typing import Tuple, List, Dict, Optional

# In-memory storage for session data (production should use Redis/Database)
_session_storage: Dict[str, dict] = {}


def get_session_data(session_id: str) -> dict:
    """Get or create session data storage."""
    if session_id not in _session_storage:
        _session_storage[session_id] = {
            "files": [],           # List of uploaded file objects
            "code": "",            # Concatenated code string
            "project_path": None,  # Path to loaded project folder
            "file_count": 0        # Number of files loaded
        }
    return _session_storage[session_id]


def load_project_files(path: str, session_id: str) -> Tuple[List[dict], Optional[str]]:
    """
    Load all Python files from a project folder recursively.
    
    Args:
        path: Directory path to load files from
        session_id: Session identifier for storing files
        
    Returns:
        Tuple of (list of file info dicts, error message or None)
    """
    if not os.path.exists(path):
        return [], f"Path does not exist: {path}"
    
    if not os.path.isdir(path):
        return [], f"Path is not a directory: {path}"
    
    session_data = get_session_data(session_id)
    files = []
    code_parts = []
    
    # Supported file extensions
    extensions = {'.py', '.txt', '.json', '.md', '.yaml', '.yml', '.toml', '.cfg', '.ini'}
    
    try:
        for root, dirs, filenames in os.walk(path):
            # Skip common exclusion directories
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in {'__pycache__', 'venv', 'env', 'node_modules', '.git'}]
            
            for filename in filenames:
                file_ext = os.path.splitext(filename)[1].lower()
                if file_ext in extensions:
                    file_path = os.path.join(root, filename)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                        
                        relative_path = os.path.relpath(file_path, path)
                        files.append({
                            "name": relative_path,
                            "content": content,
                            "full_path": file_path
                        })
                        code_parts.append(f"\n{'='*60}\nFILE: {relative_path}\n{'='*60}\n{content}\n")
                    except Exception as e:
                        print(f"Error reading {file_path}: {e}")
                        continue
        
        if not files:
            return [], f"No supported files found in {path}"
        
        # Store in session
        session_data["files"] = files
        session_data["code"] = "\n".join(code_parts)
        session_data["project_path"] = path
        session_data["file_count"] = len(files)
        
        return files, None
        
    except Exception as e:
        return [], f"Error loading project: {str(e)}"


def load_uploaded_files(files: List[dict], session_id: str) -> List[str]:
    """
    Store uploaded files in session memory.
    
    Args:
        files: List of file dicts with 'name' and 'content' keys
        session_id: Session identifier for storing files
        
    Returns:
        List of file names that were loaded
    """
    session_data = get_session_data(session_id)
    code_parts = []
    file_names = []
    
    for file in files:
        name = file.get("name", "unknown")
        content = file.get("content", "")
        
        if content:
            file_names.append(name)
            code_parts.append(f"\n{'='*60}\nFILE: {name}\n{'='*60}\n{content}\n")
    
    session_data["files"] = files
    session_data["code"] = "\n".join(code_parts)
    session_data["project_path"] = None  # Uploaded files, not a project folder
    session_data["file_count"] = len(file_names)
    
    return file_names


def get_project(session_id: str) -> Tuple[str, Optional[str]]:
    """
    Get the stored project code and project path for a session.
    
    Args:
        session_id: Session identifier
        
    Returns:
        Tuple of (code_string, project_path or None)
    """
    session_data = get_session_data(session_id)
    return session_data.get("code", ""), session_data.get("project_path")


def get_project_files(session_id: str) -> List[dict]:
    """
    Get all stored files for a session.
    
    Args:
        session_id: Session identifier
        
    Returns:
        List of file dicts with name and content
    """
    session_data = get_session_data(session_id)
    return session_data.get("files", [])


def get_file_count(session_id: str) -> int:
    """
    Get the number of files loaded in a session.
    
    Args:
        session_id: Session identifier
        
    Returns:
        Number of files
    """
    session_data = get_session_data(session_id)
    return session_data.get("file_count", 0)


def clear_session(session_id: str) -> bool:
    """
    Clear all session data.
    
    Args:
        session_id: Session identifier
        
    Returns:
        True if session existed and was cleared
    """
    if session_id in _session_storage:
        del _session_storage[session_id]
        return True
    return False


def has_files(session_id: str) -> bool:
    """
    Check if session has any files loaded.
    
    Args:
        session_id: Session identifier
        
    Returns:
        True if files exist in session
    """
    session_data = get_session_data(session_id)
    return session_data.get("file_count", 0) > 0


def get_project_summary(session_id: str) -> dict:
    """
    Get a summary of the loaded project.
    
    Args:
        session_id: Session identifier
        
    Returns:
        Dictionary with project summary information
    """
    session_data = get_session_data(session_id)
    files = session_data.get("files", [])
    
    # Group files by type
    file_types = {}
    for file in files:
        ext = os.path.splitext(file.get("name", ""))[1].lower() or "no_extension"
        file_types[ext] = file_types.get(ext, 0) + 1
    
    return {
        "file_count": len(files),
        "project_path": session_data.get("project_path"),
        "file_types": file_types,
        "total_size_bytes": sum(len(f.get("content", "")) for f in files),
        "is_project_folder": session_data.get("project_path") is not None
    }


# Optional: Save/load session to disk for persistence across server restarts
def persist_session_to_disk(session_id: str, filepath: str = None):
    """
    Save session data to disk for recovery.
    
    Args:
        session_id: Session identifier
        filepath: Optional custom filepath, defaults to ./sessions/{session_id}.json
    """
    if session_id not in _session_storage:
        return
    
    if filepath is None:
        os.makedirs("./sessions", exist_ok=True)
        filepath = f"./sessions/{session_id}.json"
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(_session_storage[session_id], f, indent=2)


def load_session_from_disk(session_id: str, filepath: str = None) -> bool:
    """
    Load session data from disk.
    
    Args:
        session_id: Session identifier
        filepath: Optional custom filepath
        
    Returns:
        True if session was loaded successfully
    """
    if filepath is None:
        filepath = f"./sessions/{session_id}.json"
    
    if not os.path.exists(filepath):
        return False
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            session_data = json.load(f)
        _session_storage[session_id] = session_data
        return True
    except Exception as e:
        print(f"Error loading session from disk: {e}")
        return False


# ============================================================
# TESTING / DEBUGGING FUNCTIONS
# ============================================================

def debug_print_session(session_id: str):
    """Print session data for debugging."""
    session_data = get_session_data(session_id)
    print(f"\n=== Session {session_id} ===")
    print(f"File count: {session_data.get('file_count', 0)}")
    print(f"Project path: {session_data.get('project_path')}")
    print(f"Code length: {len(session_data.get('code', ''))} chars")
    print(f"Files: {[f.get('name') for f in session_data.get('files', [])]}")
    print("=====================\n")


# ============================================================
# INITIALIZATION
# ============================================================

print("✅ Project loader module initialized")
print(f"   Session storage ready for {len(_session_storage)} active sessions")
