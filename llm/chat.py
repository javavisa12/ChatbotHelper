from llm.model import models
from config import MAX_TOKENS, TEMP, DEFAULT_MODEL

def chat(prompt: str, model_name: str = DEFAULT_MODEL) -> str:
    llm = models.get(model_name)

    if not llm:
        return f"Error: Model '{model_name}' not found"

    formatted = f"""
<|system|>
You are a highly skilled Python engineer.
<|user|>
{prompt}
<|assistant|>
"""

    try:
        response = llm(
            formatted,
            max_tokens=MAX_TOKENS,
            temperature=TEMP
        )

        if "choices" in response and response["choices"]:
            return response["choices"][0].get("text", "").strip()

        return "Error: Empty response"

    except Exception as e:
        return f"Error: {str(e)}"