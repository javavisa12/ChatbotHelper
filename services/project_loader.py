import os

project_path = None
project_code = ""


def load_project_files(path):
    global project_path, project_code

    if not path or not os.path.isdir(path):
        return None, "Folder not found."

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
        return None, "No Python files found."

    return loaded_files, None


def load_uploaded_files(files):
    global project_path, project_code

    project_path = None
    project_code = ""

    for f in files:
        project_code += f"\n\nFILE: {f['name']}\n{f['content']}"

    return [f["name"] for f in files]


def get_project():
    return project_code, project_path