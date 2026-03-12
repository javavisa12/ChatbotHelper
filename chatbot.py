import ollama
import os
import subprocess

MODEL = "deepseek-coder:1.3b"

project_path = None
project_code = ""


def load_project():
    global project_path, project_code

    path = input("\nEnter project folder path: ").strip().replace('"','')

    if not os.path.isdir(path):
        print("Folder not found.")
        return

    project_path = path
    project_code = ""

    print("\nScanning project files...\n")

    file_count = 0

    for root, dirs, files in os.walk(path):

        # skip unnecessary folders
        dirs[:] = [d for d in dirs if d not in ["venv", "__pycache__", ".git"]]

        for file in files:
            if file.endswith(".py"):

                full_path = os.path.join(root, file)

                print("Reading:", full_path)

                try:
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        code = f.read()

                    project_code += f"\n\nFILE: {full_path}\n"
                    project_code += code

                    file_count += 1

                except:
                    pass

    print(f"\nLoaded {file_count} Python files.")


def ask_question():

    if project_code == "":
        print("No project loaded.")
        return

    question = input("\nAsk about this project:\n")

    prompt = f"""
You are a senior Python software engineer.

Below is a Python project with multiple files.

{project_code}

User question:
{question}

Answer clearly based on the project code.
"""

    response = ollama.chat(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}]
    )

    print("\nAssistant:\n")
    print(response["message"]["content"])


def analyze_project():

    if project_code == "":
        print("No project loaded.")
        return

    prompt = f"""
You are a senior Python architect.

Analyze this entire Python project.

Provide:

1. Project summary
2. Possible bugs
3. Code quality issues
4. Performance improvements
5. Refactoring suggestions

Project code:

{project_code}
"""

    response = ollama.chat(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}]
    )

    print("\nProject Analysis:\n")
    print(response["message"]["content"])


def run_main():

    if project_path is None:
        print("No project loaded.")
        return

    main_file = input("\nEnter main file (example: main.py): ")

    full_path = os.path.join(project_path, main_file)

    if not os.path.exists(full_path):
        print("Main file not found.")
        return

    result = subprocess.run(
        ["python", full_path],
        capture_output=True,
        text=True
    )

    if result.stderr == "":
        print("\nProgram Output:\n")
        print(result.stdout)
        return

    error = result.stderr

    prompt = f"""
You are a Python debugging expert.

The following project produced an error.

Error:
{error}

Project code:
{project_code}

Explain the bug and how to fix it.
"""

    response = ollama.chat(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}]
    )

    print("\nError Analysis:\n")
    print(response["message"]["content"])


def main():

    while True:

        print("\n===== Python Project AI Assistant =====")
        print("1 Load Python Project")
        print("2 Ask Question About Project")
        print("3 Analyze Project")
        print("4 Run Main File and Debug")
        print("5 Quit")

        choice = input("\nChoose option: ")

        if choice == "1":
            load_project()

        elif choice == "2":
            ask_question()

        elif choice == "3":
            analyze_project()

        elif choice == "4":
            run_main()

        elif choice == "5":
            print("Goodbye")
            break

        else:
            print("Invalid choice")


if __name__ == "__main__":
    main()