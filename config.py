MODELS = {
    "phi3": {
        "repo_id": "microsoft/Phi-3-mini-4k-instruct-gguf",
        "filename": "Phi-3-mini-4k-instruct-q4.gguf", # 4-bit quantized model,3.8b parameters, 4096 token context
    },
    "tinyllama": {
        "repo_id": "TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF",
        "filename": "tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf", # 4-bit quantized model, 1.1b parameters, 2048 token context
    }
}

DEFAULT_MODEL = "phi3"


CTX = 4096
THREADS = 6
MAX_TOKENS = 512
TEMP = 0.2