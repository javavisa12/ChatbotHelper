import re
from datetime import datetime

def generate_session_id(text: str) -> str:
    # Clean text → safe filename
    base = re.sub(r'[^a-z0-9]+', '_', text.lower()).strip('_')

    # Limit length
    base = base[:30] if base else "chat"

    # Add timestamp
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")

    return f"{base}_{ts}"
