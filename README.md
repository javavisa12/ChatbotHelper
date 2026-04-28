((PythonAssistance) ) [mia66375@svdwh008 PythonAssistance]$ python start_llm_loader.py
[start] Loading env from: /pythonITD/PythonAssistance/.env
[start] Model file found: wizardcoder-python-34b-v1.0.Q8_0.gguf  (863 MB)

=======================================================
  LLM Loader — llama_cpp_python + StarCoder2
=======================================================
  Host        : 0.0.0.0:8505
  Model       : app/models/wizardcoder-python-34b-v1.0.Q8_0.gguf
  Context     : 4096 tokens
  Threads     : 8
  GPU layers  : 0
  Auth secret : NOT SET (open)
=======================================================

[start] Waiting for loader to be healthy at http://localhost:8505/health ...
INFO:     Started server process [1071016]
INFO:     Waiting for application startup.
2026-04-28 11:01:47,270 INFO Loading model from: app/models/wizardcoder-python-34b-v1.0.Q8_0.gguf
ERROR:    Traceback (most recent call last):
  File "/pythonITD/PythonAssistance/lib64/python3.12/site-packages/starlette/routing.py", line 638, in lifespan
    async with self.lifespan_context(app) as maybe_state:
               ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib64/python3.12/contextlib.py", line 210, in __aenter__
    return await anext(self.gen)
           ^^^^^^^^^^^^^^^^^^^^^
  File "/pythonITD/PythonAssistance/llm_loader/server.py", line 30, in lifespan
    llm = Llama(
          ^^^^^^
  File "/pythonITD/PythonAssistance/lib64/python3.12/site-packages/llama_cpp/llama.py", line 377, in __init__
    raise ValueError(f"Model path does not exist: {model_path}")
ValueError: Model path does not exist: app/models/wizardcoder-python-34b-v1.0.Q8_0.gguf

ERROR:    Application startup failed. Exiting.
