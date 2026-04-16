"""
Shared constants for audit utilities.
Centralizes logging configuration.
"""

import logging

logger = logging.getLogger("PBAI.audit")

# Optional: configure logging format if not already configured
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        "[%(asctime)s] [%(levelname)s] %(name)s: %(message)s"
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)