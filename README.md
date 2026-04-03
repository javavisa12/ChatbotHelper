- Run app.py (port:5000)
- runtime : llama_cpp_python
- model : tinyllama, phi-3 mini 

both run in same port number 


from __future__ import annotations

import json
import logging
import os
import queue
import time
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.core.auth import check_internal_secret
from app.core.config import KNOWN_HELPER_IDS, MAX_TEMPERATURE, MAX_TOKENS_LIMIT, MIN_TEMPERATURE
from app.core.state import get_model_id, track_helper_request
from app.schemas.models import InferenceRequest, InferenceResponse
from app.services.pool import checkout_llm

logger = logging.getLogger("llm_loader.main")
router = APIRouter()


def _utc_ts() -> str:
    return datetime.now(timezone(timedelta(hours=8))).isoformat(timespec="milliseconds")


def _log_metrics_table(request_id: str, table_title: str, rows: list[tuple[str, str]]) -> None:
    if not rows:
        return
    metric_col_width = max(len("Metric"), *(len(metric) for metric, _ in rows))
    value_col_width = max(len("Value"), *(len(value) for _, value in rows))
    border = f"+-{'-' * metric_col_width}-+-{'-' * value_col_width}-+"
    lines = [
        f"{table_title} (request_id={request_id})",
        border,
        f"| {'Metric'.ljust(metric_col_width)} | {'Value'.ljust(value_col_width)} |",
        border,
    ]
    lines.extend(
        f"| {metric.ljust(metric_col_width)} | {value.ljust(value_col_width)} |"
        for metric, value in rows
    )
    lines.append(border)
    logger.info("\n%s", "\n".join(lines))


def _process_rss_mb() -> float | None:
    try:
        with open("/proc/self/status", "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("VmRSS:"):
                    parts = line.split()
                    if len(parts) >= 2:
                        return int(parts[1]) / 1024.0
    except Exception:
        return None
    return None


def _proc_cpu_seconds() -> float:
    t = os.times()
    return t.user + t.system


def _resource_delta(cpu_start: float, wall_start: float) -> dict[str, float | None]:
    cpu_end = _proc_cpu_seconds()
    wall_end = time.perf_counter()
    cpu_delta = max(cpu_end - cpu_start, 0.0)
    wall_delta = max(wall_end - wall_start, 1e-9)
    avg_cores = cpu_delta / wall_delta
    cpu_count = os.cpu_count() or 1
    pct_of_single_core = avg_cores * 100.0
    pct_of_total_cpu = (avg_cores / cpu_count) * 100.0
    rss_mb = _process_rss_mb()
    return {
        "cpu_count": float(cpu_count),
        "cpu_delta": cpu_delta,
        "wall_delta": wall_delta,
        "avg_cores": avg_cores,
        "pct_of_single_core": pct_of_single_core,
        "pct_of_total_cpu": pct_of_total_cpu,
        "rss_mb": rss_mb,
    }


def _safe_usage_fields(result: dict) -> tuple[int | None, int | None, int | None]:
    usage = result.get("usage")
    if not isinstance(usage, dict):
        return None, None, None
    prompt_toks = usage.get("prompt_tokens")
    completion_toks = usage.get("completion_tokens")
    total_toks = usage.get("total_tokens")
    return (
        prompt_toks if isinstance(prompt_toks, int) else None,
        completion_toks if isinstance(completion_toks, int) else None,
        total_toks if isinstance(total_toks, int) else None,
    )


@router.post("/v1/generate")
def generate_endpoint(
    req: InferenceRequest,
    _: None = Depends(check_internal_secret),
) -> object:
    max_tokens = min(max(req.max_tokens, 1), MAX_TOKENS_LIMIT)
    temperature = min(max(req.temperature, MIN_TEMPERATURE), MAX_TEMPERATURE)

    if req.helper_id:
        if req.helper_id not in KNOWN_HELPER_IDS:
            logger.warning("Unknown helper_id=%s - not in KNOWN_HELPER_IDS", req.helper_id)
        track_helper_request(req.helper_id)

    req_id = f"gen-{uuid.uuid4().hex}"
    created = int(time.time())
    received_ts = _utc_ts()
    req_cpu_start = _proc_cpu_seconds()
    req_wall_start = time.perf_counter()

    logger.info(
        "REQ id=%s ts=%s helper=%s stream=%s",
        req_id,
        received_ts,
        req.helper_id or "-",
        int(req.stream),
    )
    cpu_count = os.cpu_count() or 1
    rss_start_mb = _process_rss_mb()

    logger.debug(
        "Inference request: helper_id=%s stream=%s max_tokens=%d temperature=%.2f",
        req.helper_id,
        req.stream,
        max_tokens,
        temperature,
    )

    if req.stream:
        return StreamingResponse(
            _stream_sse(
                req_id,
                req.prompt,
                max_tokens,
                temperature,
                req.stop,
                req.helper_id,
                req_cpu_start,
                req_wall_start,
                received_ts,
                rss_start_mb,
            ),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    try:
        t_checkout_start = time.perf_counter()
        with checkout_llm() as llm:
            t_checkout_acquired = time.perf_counter()
            queue_wait_s = t_checkout_acquired - t_checkout_start
            logger.info("OUT id=%s ts=%s stream=0", req_id, _utc_ts())
            t_infer_start = time.perf_counter()
            result = llm(
                req.prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                stop=req.stop,
                stream=False,
            )
            t_infer_end = time.perf_counter()
        text = result["choices"][0]["text"].strip()
        finish_reason = result["choices"][0].get("finish_reason") or "stop"
        prompt_toks, completion_toks, total_toks = _safe_usage_fields(result)
        usage = _resource_delta(req_cpu_start, req_wall_start)
        _log_metrics_table(
            req_id,
            "llm_loader request summary (non-streaming)",
            [
                ("Request received timestamp (UTC)", received_ts),
                ("Helper identifier", req.helper_id or "-"),
                ("Detected CPU core count in container", str(cpu_count)),
                (
                    "Resident memory usage at request start in megabytes",
                    "unknown" if rss_start_mb is None else f"{rss_start_mb:.1f}",
                ),
                ("Prompt length in characters", str(len(req.prompt))),
                ("Time waiting for an available model instance in seconds", f"{queue_wait_s:.3f}"),
                ("Model inference time in seconds", f"{(t_infer_end - t_infer_start):.3f}"),
                ("Total llm_loader time for this request in seconds", f"{(t_infer_end - req_wall_start):.3f}"),
                ("Prompt token count reported by model", str(prompt_toks) if prompt_toks is not None else "not available"),
                (
                    "Completion token count reported by model",
                    str(completion_toks) if completion_toks is not None else "not available",
                ),
                ("Total token count reported by model", str(total_toks) if total_toks is not None else "not available"),
                ("Response length in characters", str(len(text))),
                (
                    "Total process CPU time consumed during request in seconds",
                    f"{usage['cpu_delta']:.3f}",
                ),
                ("Average CPU cores used during request", f"{usage['avg_cores']:.2f}"),
                (
                    "Average CPU usage as percentage of all detected cores",
                    f"{usage['pct_of_total_cpu']:.2f}",
                ),
                (
                    "Resident memory usage at request end in megabytes",
                    "unknown" if usage["rss_mb"] is None else f"{usage['rss_mb']:.1f}",
                ),
            ],
        )
    except queue.Empty:
        logger.warning("Pool exhausted - helper_id=%s rejected", req.helper_id)
        raise HTTPException(status_code=503, detail="LLM pool exhausted - try again later")
    except Exception as exc:
        logger.error("LLM inference error (helper_id=%s): %s", req.helper_id, exc)
        raise HTTPException(status_code=500, detail=f"LLM inference error: {exc}")

    return InferenceResponse(
        id=req_id,
        model=get_model_id(),
        created=created,
        text=text,
        finish_reason=finish_reason,
    )


def _stream_sse(
    req_id: str,
    prompt: str,
    max_tokens: int,
    temperature: float,
    stop: list[str],
    helper_id: str,
    req_cpu_start: float,
    req_wall_start: float,
    received_ts: str,
    rss_start_mb: float | None,
):
    emitted_first_token = False
    first_token_wall_s: float | None = None
    emitted_chars = 0
    queue_wait_s: float | None = None
    t_checkout_start = time.perf_counter()
    logger.info(
        "Streaming request processing started inside llm_loader (request_id=%s, request_received_timestamp=%s)",
        req_id,
        received_ts,
    )
    try:
        with checkout_llm() as llm:
            t_checkout_acquired = time.perf_counter()
            queue_wait_s = t_checkout_acquired - t_checkout_start
            try:
                for raw in llm(
                    prompt,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    stop=stop,
                    stream=True,
                ):
                    token = raw["choices"][0]["text"]
                    if token:
                        if not emitted_first_token:
                            logger.info(
                                "OUT id=%s ts=%s stream=1",
                                req_id,
                                _utc_ts(),
                            )
                            first_token_wall_s = time.perf_counter() - req_wall_start
                            emitted_first_token = True
                        emitted_chars += len(token)
                        yield "data: " + json.dumps({"text": token}) + "\n\n"
            except Exception as exc:
                logger.error("LLM stream error (helper_id=%s): %s", helper_id, exc)
                yield "data: " + json.dumps({"text": f"\n\n[Error: {exc}]"}) + "\n\n"
    except queue.Empty:
        logger.warning("Pool exhausted during stream - helper_id=%s", helper_id)
        yield "data: " + json.dumps({"error": "LLM pool exhausted"}) + "\n\n"
    finally:
        total_loader_s = time.perf_counter() - req_wall_start
        usage = _resource_delta(req_cpu_start, req_wall_start)
        _log_metrics_table(
            req_id,
            "llm_loader request summary (streaming)",
            [
                ("Request received timestamp (UTC)", received_ts),
                ("Helper identifier", helper_id or "-"),
                ("Detected CPU core count in container", str(os.cpu_count() or 1)),
                (
                    "Resident memory usage at request start in megabytes",
                    "unknown" if rss_start_mb is None else f"{rss_start_mb:.1f}",
                ),
                ("Prompt length in characters", str(len(prompt))),
                (
                    "Time waiting for an available model instance in seconds",
                    f"{queue_wait_s:.3f}" if queue_wait_s is not None else "not available",
                ),
                (
                    "Time from request arrival to first streamed token in seconds",
                    f"{first_token_wall_s:.3f}" if first_token_wall_s is not None else "not available",
                ),
                ("Total llm_loader time for this request in seconds", f"{total_loader_s:.3f}"),
                ("Total streamed response length in characters", str(emitted_chars)),
                (
                    "Total process CPU time consumed during request in seconds",
                    f"{usage['cpu_delta']:.3f}",
                ),
                ("Average CPU cores used during request", f"{usage['avg_cores']:.2f}"),
                (
                    "Average CPU usage as percentage of all detected cores",
                    f"{usage['pct_of_total_cpu']:.2f}",
                ),
                (
                    "Resident memory usage at request end in megabytes",
                    "unknown" if usage["rss_mb"] is None else f"{usage['rss_mb']:.1f}",
                ),
            ],
        )

    yield "data: [DONE]\n\n"
    response = transport.handle_request(request)
