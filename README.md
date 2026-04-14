import requests
from config import LLM_LOADER_URL, LLM_LOADER_SECRET


def health_check() -> dict:
    """Check if the llm_loader service is reachable and has models loaded."""
    try:
        response = requests.post(
            f"{LLM_LOADER_URL}/health",
            headers={"X-Internal-Secret": LLM_LOADER_SECRET},
            timeout=5,
            json={}  # optional, but safer for POST
        )
        response.raise_for_status()
        return response.json()

    except requests.exceptions.ConnectionError:
        return {"status": "unreachable"}
    except requests.exceptions.Timeout:
        return {"status": "timeout"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}
