"""Project loader service for Python Assistant. Manages project file loading and storage."""

import os
import json
from typing import Tuple, Dict, Optional, List


# In-memory session storage (replace with database in production)
_sessions: Dict[str, Dict] = {}


def get_project(session_id: str) -> Tuple[str, Optional[str]]:
    """
    Retrieve project code and path for a given session.
    
    Args:
        session_id: Unique session identifier
        
    Returns:
        Tuple of (project_code: str, project_path: Optional[str])
    """
    if session_id not in _sessions:
        return "", None
    
    session_data = _sessions[session_id]
    project_code = session_data.get("project_code", "")
    project_path = session_data.get("project_path")
    
    return project_code, project_path


def load_project_files(path: str, session_id: str) -> Tuple[List[str], Optional[str]]:
    """
    Load all Python files from a project directory and store in session.
    
    Args:
        path: Path to the project directory
        session_id: Unique session identifier to store project data
        
    Returns:
        Tuple of (file_list: List[str], error: Optional[str])
        - file_list: List of relative file paths loaded
        - error: Error message if any, None if successful
    """
    if not os.path.isdir(path):
        return [], f"Path does not exist or is not a directory: {path}"
    
    files = {}
    file_list = []
    
    try:
        for root, dirs, filenames in os.walk(path):
            # Skip hidden directories and common exclusions
            dirs[:] = [d for d in dirs if not d.startswith('.') and d != '__pycache__']
            
            for filename in filenames:
                if filename.endswith('.py'):
                    filepath = os.path.join(root, filename)
                    relative_path = os.path.relpath(filepath, path)
                    
                    try:
                        with open(filepath, 'r', encoding='utf-8') as f:
                            content = f.read()
                            files[relative_path] = content
                            file_list.append(relative_path)
                    except Exception as e:
                        print(f"Warning: Could not read {filepath}: {e}")
        
        if not files:
            return [], f"No Python files found in {path}"
        
        # Combine all project code into a single string
        project_code = _combine_project_code(files)
        
        # Store in session
        _sessions[session_id] = {
            "project_path": path,
            "project_code": project_code,
            "files": files,
            "file_list": file_list
        }
        
        return file_list, None
        
    except Exception as e:
        return [], f"Error loading project: {str(e)}"


def load_uploaded_files(file_contents: List[Dict], session_id: str) -> Tuple[List[str], Optional[str]]:
    """
    Load uploaded Python files and store in session.
    
    Args:
        file_contents: List of dicts with 'name' and 'content' keys
        session_id: Unique session identifier to store project data
        
    Returns:
        Tuple of (file_names: List[str], error: Optional[str])
    """
    if not file_contents:
        return [], "No files provided"
    
    files = {}
    file_names = []
    
    try:
        for file_item in file_contents:
            name = file_item.get("name", "").strip()
            content = file_item.get("content", "")
            
            if not name or not name.endswith('.py'):
                continue
            
            files[name] = content
            file_names.append(name)
        
        if not files:
            return [], "No valid Python files provided"
        
        # Combine all project code
        project_code = _combine_project_code(files)
        
        # Store in session
        if session_id not in _sessions:
            _sessions[session_id] = {}
        
        _sessions[session_id].update({
            "project_code": project_code,
            "files": files,
            "file_list": file_names,
            "project_path": None  # Uploaded files have no path
        })
        
        return file_names, None
        
    except Exception as e:
        return [], f"Error loading files: {str(e)}"


def get_session_files(session_id: str) -> Dict[str, str]:
    """
    Get all files in a session.
    
    Args:
        session_id: Unique session identifier
        
    Returns:
        Dictionary mapping file names to their contents
    """
    if session_id not in _sessions:
        return {}
    
    return _sessions[session_id].get("files", {})


def get_session_file_list(session_id: str) -> List[str]:
    """
    Get list of file names in a session.
    
    Args:
        session_id: Unique session identifier
        
    Returns:
        List of file names
    """
    if session_id not in _sessions:
        return []
    
    return _sessions[session_id].get("file_list", [])


def update_session_file(session_id: str, filename: str, content: str) -> bool:
    """
    Update a file in a session.
    
    Args:
        session_id: Unique session identifier
        filename: Name of the file to update
        content: New content
        
    Returns:
        True if successful, False otherwise
    """
    if session_id not in _sessions:
        return False
    
    _sessions[session_id]["files"][filename] = content
    
    # Update combined project code
    files = _sessions[session_id].get("files", {})
    _sessions[session_id]["project_code"] = _combine_project_code(files)
    
    return True


def delete_session(session_id: str) -> bool:
    """
    Delete a session.
    
    Args:
        session_id: Unique session identifier
        
    Returns:
        True if successful, False otherwise
    """
    if session_id in _sessions:
        del _sessions[session_id]
        return True
    return False


def _combine_project_code(files: Dict[str, str]) -> str:
    """
    Combine all project files into a single code string.
    
    Args:
        files: Dictionary mapping file names to contents
        
    Returns:
        Combined project code as a string
    """
    combined = []
    for filename in sorted(files.keys()):
        combined.append(f"# File: {filename}")
        combined.append("=" * 60)
        combined.append(files[filename])
        combined.append("\n")
    
    return "\n".join(combined)
