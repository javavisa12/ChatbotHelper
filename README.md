"""LLM Loader server — llama_cpp_python backend."""
import time
import logging
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from llama_cpp import Llama

import model_config as cfg

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("llm_loader")

llm: Optional[Llama] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global llm
    log.info("Loading model from: %s", cfg.MODEL_PATH)
    t0 = time.time()
    llm = Llama(
        model_path=cfg.MODEL_PATH,
        n_ctx=cfg.N_CTX,
        n_threads=cfg.N_THREADS,
        n_gpu_layers=cfg.N_GPU_LAYERS,
        verbose=False,
    )
    log.info("Model loaded in %.1fs", time.time() - t0)
    yield
    del llm


app = FastAPI(lifespan=lifespan)


class GenerateRequest(BaseModel):
    prompt: str
    max_tokens: int = cfg.MAX_TOKENS
    temperature: float = cfg.TEMPERATURE
    stop: list[str] = ["<|endoftext|>"]
    helper_id: str = "python_assistant"


def _check_secret(x_secret: str = "") -> None:
    if cfg.LLM_INTERNAL_SECRET and x_secret != cfg.LLM_INTERNAL_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.get("/health")
def health():
    return {"status": "healthy", "model_loaded": llm is not None}


@app.post("/generate")
def generate(
    body: GenerateRequest,
    x_secret: str = Header(default="", alias="X-Secret"),
):
    _check_secret(x_secret)

    if llm is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    output = llm(
        body.prompt,
        max_tokens=body.max_tokens,
        temperature=body.temperature,
        stop=body.stop,
        echo=False,
    )

    return {
        "text": output["choices"][0]["text"],   # ← "text" matches chat.py
        "tokens_used": output["usage"]["total_tokens"],
    }
