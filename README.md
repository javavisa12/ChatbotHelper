"""
LLM Loader — llama_cpp_python backend.
Exposes POST /generate consumed by the Flask app.
"""
from __future__ import annotations
import logging
import time
from contextlib import asynccontextmanager
from typing import Optional

import uvicorn
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from llama_cpp import Llama

import model_config as cfg

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("llm_loader")

# ── Global model handle ─────────────────────────────────────────────────────
llm: Optional[Llama] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global llm
    log.info("Loading model from: %s", cfg.MODEL_PATH)
    t0 = time.time()
    llm = Llama(
        model_path=cfg.MODEL_PATH,
        n_ctx=cfg.N_CTX,
        n_gpu_layers=cfg.N_GPU_LAYERS,
        n_threads=cfg.N_THREADS,
        verbose=False,
    )
    log.info("Model loaded in %.1fs", time.time() - t0)
    yield
    # cleanup on shutdown
    del llm


app = FastAPI(title="LLM Loader", lifespan=lifespan)


# ── Request / Response schemas ──────────────────────────────────────────────
class GenerateRequest(BaseModel):
    prompt: str
    max_tokens: int = cfg.MAX_TOKENS
    temperature: float = cfg.TEMPERATURE
    stop: list[str] = ["<|endoftext|>", "```\n\n"]
    helper_id: str = "python_assistant"   # forwarded by Flask, ignored here


class GenerateResponse(BaseModel):
    text: str
    tokens_used: int
    model: str = "starcoder2"


# ── Auth helper ─────────────────────────────────────────────────────────────
def _check_secret(x_secret: str = "") -> None:
    if cfg.SECRET and x_secret != cfg.SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")


# ── Endpoints ───────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "healthy", "model_loaded": llm is not None}


@app.post("/generate", response_model=GenerateResponse)
def generate(
    body: GenerateRequest,
    x_secret: str = Header(default="", alias="X-Secret"),
):
    _check_secret(x_secret)

    if llm is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    log.info("Generating — helper_id=%s max_tokens=%d", body.helper_id, body.max_tokens)

    output = llm(
        body.prompt,
        max_tokens=body.max_tokens,
        temperature=body.temperature,
        stop=body.stop,
        echo=False,
    )

    text       = output["choices"][0]["text"]
    tokens_used = output["usage"]["total_tokens"]

    return GenerateResponse(text=text, tokens_used=tokens_used)
