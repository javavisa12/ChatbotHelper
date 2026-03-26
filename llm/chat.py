from llm.model import models
from config import MAX_TOKENS, TEMP, DEFAULT_MODEL

def chat(input_data, model_name: str = DEFAULT_MODEL) -> str:
    llm = models.get(model_name)

    if not llm:
        return f"Error: Model '{model_name}' not found"

    try:
        # 🧠 ✅ NEW: If messages list → build conversation prompt
        if isinstance(input_data, list):
            formatted = "<|system|>\nYou are a highly skilled Python engineer.\n"

            for msg in input_data:
                role = msg.get("role")
                content = msg.get("content", "")

                if role == "user":
                    formatted += f"<|user|>\n{content}\n"
                elif role == "assistant":
                    formatted += f"<|assistant|>\n{content}\n"
                elif role == "system":
                    formatted = f"<|system|>\n{content}\n"

            formatted += "<|assistant|>\n"

        # 🧾 ✅ OLD: single prompt (fallback)
        else:
            formatted = f"""
<|system|>
You are a highly skilled Python engineer.
<|user|>
{input_data}
<|assistant|>
"""

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