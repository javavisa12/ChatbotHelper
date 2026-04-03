'''LLM chat interface that connects to the company llm_loader service.'''

import os
import requests
from config import MAX_TOKENS, TEMP, LLM_LOADER_URL, LLM_LOADER_SECRET, LLM_HELPER_ID


def chat(input_data) -> str:

    # Build prompt
    if isinstance(input_data, list):
        formatted = "<|im_start|>system\nYou are a highly skilled Python engineer.<|im_end|>\n"
        for msg in input_data:
            role    = msg.get("role")
            content = msg.get("content", "")
            formatted += f"<|im_start|>{role}\n{content}<|im_end|>\n"
        formatted += "<|im_start|>assistant\n"
    else:
        formatted = f"""<|im_start|>system
You are a highly skilled Python engineer.<|im_end|>
<|im_start|>user
{input_data}<|im_end|>
<|im_start|>assistant
"""

    try:
        response = requests.post(
            f"{LLM_LOADER_URL}/v1/generate",
            headers={
                "Content-Type":    "application/json",
                "X-Internal-Secret": LLM_LOADER_SECRET,
            },
            json={
                "prompt":      formatted,
                "max_tokens":  MAX_TOKENS,
                "temperature": TEMP,
                "stop":        ["<|im_end|>", "<|im_start|>"],
                "stream":      False,
                "helper_id":   LLM_HELPER_ID,
            },
            timeout=60,
        )
        response.raise_for_status()
        return response.json().get("text", "Error: empty response")

    except requests.exceptions.Timeout:
        return "Error: LLM request timed out"
    except requests.exceptions.ConnectionError:
        return "Error: Cannot connect to llm_loader"
    except requests.exceptions.HTTPError as e:
        return f"Error: llm_loader returned {e.response.status_code}"
    except Exception as e:
        return f"Error: {str(e)}"
