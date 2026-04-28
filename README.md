((PythonAssistance) ) [mia66375@svdwh008 PythonAssistance]$ python start_llm_loader.py
[start] Loading env from: /pythonITD/PythonAssistance/.env
[start] Model file found: wizardcoder-python-34b-v1.0.Q8_0.gguf  (863 MB)

=======================================================
  LLM Loader — llama_cpp_python + StarCoder2
=======================================================
  Host        : 0.0.0.0:8505
  Model       : /pythonITD/PythonAssistance/app/models/wizardcoder-python-34b-v1.0.Q8_0.gguf
  Context     : 4096 tokens
  Threads     : 8
  GPU layers  : 0
  Auth secret : NOT SET (open)
=======================================================

[start] Waiting for loader to be healthy at http://localhost:8505/health ...
INFO:     Started server process [1098515]
INFO:     Waiting for application startup.
2026-04-28 11:04:34,002 INFO Loading model from: /pythonITD/PythonAssistance/app/models/wizardcoder-python-34b-v1.0.Q8_0.gguf
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
  File "/pythonITD/PythonAssistance/lib64/python3.12/site-packages/llama_cpp/llama.py", line 381, in __init__
    internals.LlamaModel(
  File "/pythonITD/PythonAssistance/lib64/python3.12/site-packages/llama_cpp/_internals.py", line 59, in __init__
    raise ValueError(f"Failed to load model from file: {path_model}")
ValueError: Failed to load model from file: /pythonITD/PythonAssistance/app/models/wizardcoder-python-34b-v1.0.Q8_0.gguf

Exception ignored in: <function LlamaModel.__del__ at 0x7f975aaf3c40>
Traceback (most recent call last):
  File "/pythonITD/PythonAssistance/lib64/python3.12/site-packages/llama_cpp/_internals.py", line 87, in __del__
    self.close()
  File "/pythonITD/PythonAssistance/lib64/python3.12/site-packages/llama_cpp/_internals.py", line 79, in close
    if self.sampler is not None:
       ^^^^^^^^^^^^
AttributeError: 'LlamaModel' object has no attribute 'sampler'
ERROR:    Application startup failed. Exiting.
