# Main Application Environment Variables Examples

# Access control mode: "legacy" (hardcoded groups) or "ad" (AD memberOf + group_access.json)
PBAI_ACCESS_MODE=ad

PBAI_SESSION_TIMEOUT=1800

POLICY_RAG_API_KEY=changeme-secret-key
POLICY_RAG_ALLOWED_ORIGINS=http://localhost:3000
POLICY_RAG_PORT=8502

# PBAI_STORAGE_ROOT in 008 and in my own environment is set to a sibling directory of main_application ../storage_volume
# PBAI_STORAGE_ROOT in OpenShift should be set to /app/storage_volume
PBAI_STORAGE_ROOT=../storage_volume
PBAI_MUTABLE_ROOT=
PBAI_RUNTIME_DIR=

PBAI_MODEL_TYPE=Qwen2.5
PBAI_MODEL_ID=local-model
PBAI_MAX_TOKENS=4096
PBAI_CONVERSATION_HISTORY_TURNS=0
PBAI_TEMPERATURE=0.3

PBAI_CHUNK_MODE=fixed
PBAI_CHUNK_MIN_CHARS=900
PBAI_CHUNK_TARGET_CHARS=1600
PBAI_CHUNK_MAX_CHARS=2400
PBAI_CHUNK_OVERLAP_SENTENCES=2
PBAI_CHUNK_SIM_THRESHOLD=0.1
PBAI_INDEX_BATCH_SIZE=20
INDEX_BATCH_SIZE=20

LLM_LOADER_URL=http://localhost:8501
LLM_INTERNAL_SECRET=
LLM_HELPER_ID = python-assistant 

LLM_CLIENT_CONNECT_TIMEOUT=5.0
LLM_CLIENT_READ_TIMEOUT=120.0

PBAI_SQLITE_JOURNAL_MODE=DELETE

# File operation audit log format: "day" (one file per day) or "month" (one file per month)
PBAI_FILE_AUDIT_FORMAT=month

# Meta display mode: "showall" (times + confidence), "confidenceonly", or "none"
PBAI_META_DISPLAY=showall
