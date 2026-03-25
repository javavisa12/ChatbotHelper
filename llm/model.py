from llama_cpp import Llama
from config import MODELS, CTX, THREADS

loaded_models = {}

def load_models():
    global loaded_models

    for name, cfg in MODELS.items():
        print(f"Loading model: {name}")

        loaded_models[name] = Llama.from_pretrained(
            repo_id=cfg["repo_id"],
            filename=cfg["filename"],
            n_ctx=CTX,
            n_threads=THREADS,
        )

    return loaded_models


# Load at startup
models = load_models()