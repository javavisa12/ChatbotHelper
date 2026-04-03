from __future__ import annotations

import json
import logging
import queue
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, StreamingResponse

from app.core.config import (
    HELPER_CAPACITY_POLICY,
    MAX_TEMPERATURE,
    MAX_TOKENS_LIMIT,
    MIN_TEMPERATURE,
    N_LLM_INSTANCES,
    TEST_FALLBACK_TEXT,
    TEST_MAX_TOKENS,
    TEST_PROMPT,
    TEST_TEMPERATURE,
)
from app.core.constants import LLM_AVAILABLE
from app.core.state import helper_counts_snapshot
from app.services.pool import checkout_llm, pool_status

logger = logging.getLogger("llm_loader.main")
router = APIRouter()


@router.get("/liveness")
def liveness() -> dict:
    return {"status": "alive"}


@router.get("/health")
def health() -> dict:
    status = pool_status()
    return {
        "status": "ok" if status["pool_total"] > 0 else "no_model",
        "llm_available": LLM_AVAILABLE,
        **status,
        "helper_capacity_policy": HELPER_CAPACITY_POLICY,
        "helper_request_counts": helper_counts_snapshot(),
    }


@router.get("/test")
def test_inference() -> dict:
    status = pool_status()
    model_loaded = status.get("pool_total", 0) > 0

    if not model_loaded:
        return {
            "status": "fallback",
            "model_loaded": False,
            "prompt": TEST_PROMPT,
            "response": TEST_FALLBACK_TEXT,
        }

    try:
        with checkout_llm() as llm:
            result = llm(
                TEST_PROMPT,
                max_tokens=max(1, TEST_MAX_TOKENS),
                temperature=max(0.0, TEST_TEMPERATURE),
                stop=[],
                stream=False,
            )
        text = (result["choices"][0]["text"] or "").strip()
        return {
            "status": "ok",
            "model_loaded": True,
            "prompt": TEST_PROMPT,
            "response": text or "(empty response)",
        }
    except queue.Empty:
        return {
            "status": "busy",
            "model_loaded": True,
            "prompt": TEST_PROMPT,
            "response": "LLM pool exhausted - try again shortly",
        }
    except Exception as exc:
        logger.error("Test inference failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Test inference failed: {exc}")


def _concurrent_worker(
    worker_index: int,
    prompt: str,
    max_tokens: int,
    temperature: float,
    event_queue: queue.Queue,
) -> None:
    start_ts = time.time()
    start_perf = time.perf_counter()
    event_queue.put(
        {
            "event": "queued",
            "worker_index": worker_index,
            "timestamp": start_ts,
            "message": f"Worker {worker_index} queued for model checkout",
        }
    )

    try:
        with checkout_llm() as llm:
            acquired_perf = time.perf_counter()
            queue_wait_seconds = acquired_perf - start_perf
            event_queue.put(
                {
                    "event": "acquired",
                    "worker_index": worker_index,
                    "timestamp": time.time(),
                    "queue_wait_seconds": round(queue_wait_seconds, 3),
                    "message": f"Worker {worker_index} acquired model after {queue_wait_seconds:.3f}s",
                }
            )

            result = llm(
                prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                stop=[],
                stream=False,
            )
            text = (result["choices"][0]["text"] or "").strip()
            total_seconds = time.perf_counter() - start_perf
            event_queue.put(
                {
                    "event": "done",
                    "worker_index": worker_index,
                    "timestamp": time.time(),
                    "status": "ok",
                    "queue_wait_seconds": round(queue_wait_seconds, 3),
                    "total_seconds": round(total_seconds, 3),
                    "response_chars": len(text),
                    "message": f"Worker {worker_index} done in {total_seconds:.3f}s",
                }
            )
    except queue.Empty:
        total_seconds = time.perf_counter() - start_perf
        event_queue.put(
            {
                "event": "done",
                "worker_index": worker_index,
                "timestamp": time.time(),
                "status": "pool_timeout",
                "total_seconds": round(total_seconds, 3),
                "response_chars": 0,
                "message": f"Worker {worker_index} timed out waiting for model ({total_seconds:.3f}s)",
            }
        )
    except Exception as exc:
        total_seconds = time.perf_counter() - start_perf
        event_queue.put(
            {
                "event": "done",
                "worker_index": worker_index,
                "timestamp": time.time(),
                "status": "error",
                "total_seconds": round(total_seconds, 3),
                "response_chars": 0,
                "error": str(exc),
                "message": f"Worker {worker_index} failed: {exc}",
            }
        )


def _sse_line(payload: dict) -> str:
    return "data: " + json.dumps(payload) + "\n\n"


def _stream_concurrent_test(
    concurrency: int,
    prompt: str,
    max_tokens: int,
    temperature: float,
):
    status = pool_status()
    if status.get("pool_total", 0) <= 0:
        yield _sse_line(
            {
                "event": "summary",
                "status": "no_model",
                "message": "No model instances loaded in pool",
            }
        )
        yield "data: [DONE]\n\n"
        return

    started_perf = time.perf_counter()
    event_queue: queue.Queue = queue.Queue()
    yield _sse_line(
        {
            "event": "start",
            "status": "running",
            "concurrency": concurrency,
            "configured_n_llm_instances": N_LLM_INSTANCES,
            "pool_total": status.get("pool_total", 0),
            "pool_idle_at_start": status.get("pool_idle", 0),
            "max_tokens": max_tokens,
            "temperature": temperature,
            "prompt_chars": len(prompt),
            "message": "Concurrent test started",
        }
    )

    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [
            executor.submit(
                _concurrent_worker,
                i + 1,
                prompt,
                max_tokens,
                temperature,
                event_queue,
            )
            for i in range(concurrency)
        ]

        completed_workers = 0
        ok_count = 0
        timeout_count = 0
        error_count = 0
        durations: list[float] = []
        queue_waits: list[float] = []

        while completed_workers < concurrency:
            event = event_queue.get()
            yield _sse_line(event)
            if event.get("event") != "done":
                continue
            completed_workers += 1
            worker_status = str(event.get("status", "error"))
            if worker_status == "ok":
                ok_count += 1
            elif worker_status == "pool_timeout":
                timeout_count += 1
            else:
                error_count += 1
            if "total_seconds" in event:
                durations.append(float(event["total_seconds"]))
            if "queue_wait_seconds" in event:
                queue_waits.append(float(event["queue_wait_seconds"]))

        for fut in futures:
            try:
                fut.result()
            except Exception:
                pass

    total_elapsed = time.perf_counter() - started_perf
    summary = {
        "event": "summary",
        "status": "completed",
        "concurrency": concurrency,
        "completed_workers": completed_workers,
        "ok_count": ok_count,
        "pool_timeout_count": timeout_count,
        "error_count": error_count,
        "total_test_seconds": round(total_elapsed, 3),
        "avg_worker_total_seconds": round(sum(durations) / len(durations), 3) if durations else None,
        "avg_queue_wait_seconds": round(sum(queue_waits) / len(queue_waits), 3) if queue_waits else None,
        "message": "Concurrent test finished",
    }
    yield _sse_line(summary)
    yield "data: [DONE]\n\n"


@router.get("/test_concurrent")
def test_concurrent(
    concurrency: int = N_LLM_INSTANCES,
    prompt: str = TEST_PROMPT,
    max_tokens: int = 128,
    temperature: float = TEST_TEMPERATURE,
) -> StreamingResponse:
    if concurrency < 1 or concurrency > 128:
        raise HTTPException(status_code=400, detail="concurrency must be between 1 and 128")
    bounded_max_tokens = min(max(max_tokens, 1), MAX_TOKENS_LIMIT)
    bounded_temperature = min(max(temperature, MIN_TEMPERATURE), MAX_TEMPERATURE)

    return StreamingResponse(
        _stream_concurrent_test(
            concurrency=concurrency,
            prompt=prompt,
            max_tokens=bounded_max_tokens,
            temperature=bounded_temperature,
        ),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/dashboard", response_class=FileResponse)
def dashboard() -> FileResponse:
    dashboard_path = Path(__file__).resolve().parents[1] / "frontend" / "dashboard.html"
    if not dashboard_path.exists():
        raise HTTPException(status_code=404, detail="Dashboard file not found")
    return FileResponse(dashboard_path)


@router.get("/style.css", response_class=FileResponse)
def dashboard_css() -> FileResponse:
    css_path = Path(__file__).resolve().parents[1] / "frontend" / "style.css"
    if not css_path.exists():
        raise HTTPException(status_code=404, detail="Dashboard css not found")
    return FileResponse(css_path, media_type="text/css")


@router.get("/app.js", response_class=FileResponse)
def dashboard_js() -> FileResponse:
    js_path = Path(__file__).resolve().parents[1] / "frontend" / "app.js"
    if not js_path.exists():
        raise HTTPException(status_code=404, detail="Dashboard js not found")
    return FileResponse(js_path, media_type="application/javascript")
