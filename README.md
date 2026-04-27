if explain_mode:
    prompt = f"""
You are a senior Python engineer.

Task:
- Explain the given code ONLY using comments inside the code.
- Do NOT give explanation outside the code.
- Do NOT change the logic.
- Add clear, concise comments (#) for each important line.

Code:
{code if code else question}
"""
else:
    if code or has_attachments:
        prompt = f"""
You are a senior Python engineer.
Answer based on the attached files.

Rules:
- 1-2 sentence explanation
- Clean code
- Code in code block

Project/Attached files:
{code if code else '(Files included inline in the question)'}

Question:
{question}
"""
    else:
        prompt = f"""
You are a senior Python engineer.
Answer clearly and concisely.

Rules:
- Short explanation (1-2 sentences)
- Provide working code
- Clean code

Question:
{question}
"""
