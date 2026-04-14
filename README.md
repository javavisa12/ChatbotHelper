"""Model management for Python Assistant - delegates to company llm_loader service."""

import requests
from config import LLM_LOADER_URL, LLM_LOADER_SECRET


def health_check() -> dict:
    """Check if the llm_loader service is reachable and has models loaded."""
    try:
        response = requests.get(
            f"{LLM_LOADER_URL}/health",
            headers={"X-Internal-Secret": LLM_LOADER_SECRET},
            timeout=5,
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.ConnectionError:
        return {"status": "unreachable"}
    except requests.exceptions.Timeout:
        return {"status": "timeout"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}


def test_inference() -> dict:
    """Run a test prompt against the llm_loader service."""
    try:
        response = requests.get(
            f"{LLM_LOADER_URL}/test",
            headers={"X-Internal-Secret": LLM_LOADER_SECRET},
            timeout=30,
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"status": "error", "detail": str(e)}


# Verify connection at startup
_health = health_check()
_status = _health.get("status")

if _status == "ok":
    print(f"✅ Connected to llm_loader — pool_total={_health.get('pool_total')}, pool_idle={_health.get('pool_idle')}")
elif _status == "no_model":
    print("⚠️  llm_loader reachable but no model loaded")
elif _status == "unreachable":
    print(f"❌ Cannot connect to llm_loader at {LLM_LOADER_URL}")
else:
    print(f"⚠️  llm_loader status: {_health}")
