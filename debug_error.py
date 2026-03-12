import ollama

error = input("Paste Python error:\n")

prompt = f"""
You are a Python debugging expert.

Explain this error and provide the fix.

Error:
{error}

Explain:
1. Why it happens
2. How to fix it
3. Correct code example
"""

response = ollama.chat(
    model="deepseek-coder:1.3b",
    messages=[{"role": "user", "content": prompt}]
)

print("\nSolution:\n")
print(response["message"]["content"])