import ollama

def analyze_file(filepath):

    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()

    prompt = f"""
You are a senior Python code reviewer.

Analyze the following Python code carefully.

Tasks:
1. Identify actual bugs or runtime errors.
2. Explain why the bug happens.
3. Provide corrected code.
4. Suggest performance improvements.
5. Suggest cleaner Pythonic alternatives.

IMPORTANT:
- Be specific.
- Refer to the exact line of code.
- Provide corrected code snippets.

Code:
{code}
"""

    response = ollama.chat(
        model="deepseek-coder:1.3b",
        messages=[{"role": "user", "content": prompt}]
    )

    print(response["message"]["content"])


file = input("Enter python file path: ")
analyze_file(file)