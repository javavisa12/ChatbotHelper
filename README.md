'''LLM chat interface that connects to the llm_loader service.'''
import os
import requests
from config import MAX_TOKENS, TEMP, LLM_LOADER_URL, LLM_LOADER_SECRET, LLM_HELPER_ID

def chat(input_data) -> str:
    # Build prompt — StarCoder2 uses plain text, not chat tokens
    if isinstance(input_data, list):
        formatted = ""
        for msg in input_data:
            role    = msg.get("role")
            content = msg.get("content", "")
            formatted += f"# {role}\n{content}\n"
        formatted += "# assistant\n"
    else:
        formatted = f"# system\nYou are a highly skilled Python engineer.\n# user\n{input_data}\n# assistant\n"

    try:
        response = requests.get(
            f"{LLM_LOADER_URL}/generate",        
            headers={
                "Content-Type": "application/json",
                "X-Secret": LLM_LOADER_SECRET,   
            },
            json={
                "prompt":      formatted,
                "max_tokens":  MAX_TOKENS,
                "temperature": TEMP,
                "stop":        ["<|endoftext|>", "```\n\n"],  
                "stream":      False,
                "helper_id":   LLM_HELPER_ID,
            },
            timeout=180,
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
