'''services/project_loader.py'''
import os

# This dictionary stores your file contents in memory indexed by session_id
SESSION_DATA = {} 

def get_project(session_id):
    """Retrieves the code for the LLM context."""
    data = SESSION_DATA.get(session_id)
    if not data:
        return None, None
    
    # Combine all files into one string for the AI to read
    combined_code = ""
    for filename, content in data['files'].items():
        combined_code += f"### FILE: {filename} ###\n{content}\n\n"
        
    return combined_code, data.get('path')

def load_uploaded_files(files, session_id):
    """Saves files from the frontend into the SESSION_DATA."""
    if session_id not in SESSION_DATA:
        SESSION_DATA[session_id] = {'files': {}, 'path': 'uploaded_files'}
    
    file_names = []
    for f in files:
        name = f.get('name')
        content = f.get('content')
        SESSION_DATA[session_id]['files'][name] = content
        file_names.append(name)
    return file_names

def load_project_files(path, session_id):
    """Reads a local directory into SESSION_DATA."""
    if not os.path.exists(path):
        return None, "Path not found"
    
    files_dict = {}
    for root, _, files in os.walk(path):
        for file in files:
            if file.endswith('.py'):
                with open(os.path.join(root, file), 'r') as f:
                    files_dict[file] = f.read()
    
    SESSION_DATA[session_id] = {'files': files_dict, 'path': path}
    return list(files_dict.keys()), None
