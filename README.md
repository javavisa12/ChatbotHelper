# start_llm_loader.py

import subprocess
import sys

import llm_loader.model_config as cfg

cmd = [
    sys.executable,
    "-m",
    "uvicorn",
    "server:app",
    "--host",
    cfg.LLM_HOST,
    "--port",
    str(cfg.LLM_PORT)
]

print("\n====================================")
print("Starting LLM Loader")
print("====================================")
print(f"Model : {cfg.MODEL_PATH}")
print(f"Port  : {cfg.LLM_PORT}")
print("====================================\n")

subprocess.run(cmd, cwd="llm_loader")










# llm_loader/server.py

from contextlib import asynccontextmanager
from typing import Optional
import time

from fastapi import FastAPI
from pydantic import BaseModel
from llama_cpp import Llama

import model_config as cfg

llm: Optional[Llama] = None


@asynccontextmanager
async def lifespan(app: FastAPI):

    global llm

    print(f"\nLoading model:\n{cfg.MODEL_PATH}\n")

    start = time.time()

    llm = Llama(
        model_path=cfg.MODEL_PATH,
        n_ctx=cfg.N_CTX,
        n_threads=cfg.N_THREADS,
        n_gpu_layers=cfg.N_GPU_LAYERS,
        verbose=False,
    )

    print(f"Model loaded in {time.time() - start:.2f}s")

    yield

    del llm


app = FastAPI(lifespan=lifespan)


class GenerateRequest(BaseModel):
    prompt: str
    max_tokens: int = cfg.MAX_TOKENS
    temperature: float = cfg.TEMPERATURE


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/generate")
def generate(body: GenerateRequest):

    output = llm(
        body.prompt,
        max_tokens=body.max_tokens,
        temperature=body.temperature,
        echo=False
    )

    return {
        "response": output["choices"][0]["text"]
    }








    # llm_loader/model_config.py

import os
from dotenv import load_dotenv

load_dotenv()

MODEL_PATH = os.getenv("MODEL_PATH")

LLM_HOST = os.getenv("LLM_HOST", "0.0.0.0")
LLM_PORT = int(os.getenv("LLM_PORT", 8505))

N_CTX = int(os.getenv("N_CTX", 2048))
N_THREADS = int(os.getenv("N_THREADS", 8))
N_GPU_LAYERS = int(os.getenv("N_GPU_LAYERS", 0))

MAX_TOKENS = int(os.getenv("MAX_TOKENS", 256))
TEMPERATURE = float(os.getenv("TEMPERATURE", 0.2))

LLM_INTERNAL_SECRET = os.getenv("LLM_INTERNAL_SECRET", "")









MODEL_PATH=/pythonITD/PythonAssistance/app/models/starcoder2-15b-Q4_K_M.gguf

LLM_HOST=0.0.0.0
LLM_PORT=8505

N_CTX=2048
N_THREADS=8
N_GPU_LAYERS=0

MAX_TOKENS=256
TEMPERATURE=0.2

LLM_INTERNAL_SECRET=
