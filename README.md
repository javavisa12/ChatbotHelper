[start] Loading env from: /pythonITD/PythonAssistance/.env
[start] Model file found: starcoder2-15b-Q8_0.gguf  (15758 MB)

=======================================================
  LLM Loader — llama_cpp_python + StarCoder2
=======================================================
  Host        : 0.0.0.0:8505
  Model       : /pythonITD/PythonAssistance/app/models/starcoder2-15b-Q8_0.gguf
  Context     : 4096 tokens
  Threads     : 8
  GPU layers  : 0
  Auth secret : NOT SET (open)
=======================================================

[start] Waiting for loader to be healthy at http://localhost:8505/health ...
INFO:     Started server process [705459]
INFO:     Waiting for application startup.
2026-04-28 10:18:26,349 INFO Loading model from: /pythonITD/PythonAssistance/app/models/starcoder2-15b-Q8_0.gguf
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
  File "/pythonITD/PythonAssistance/lib64/python3.12/site-packages/llama_cpp/llama.py", line 374, in __init__
    internals.LlamaModel(
  File "/pythonITD/PythonAssistance/lib64/python3.12/site-packages/llama_cpp/_internals.py", line 58, in __init__
    raise ValueError(f"Failed to load model from file: {path_model}")
ValueError: Failed to load model from file: /pythonITD/PythonAssistance/app/models/starcoder2-15b-Q8_0.gguf

Exception ignored in: <function LlamaModel.__del__ at 0x7f91da535ee0>
Traceback (most recent call last):
  File "/pythonITD/PythonAssistance/lib64/python3.12/site-packages/llama_cpp/_internals.py", line 86, in __del__
    self.close()
  File "/pythonITD/PythonAssistance/lib64/python3.12/site-packages/llama_cpp/_internals.py", line 78, in close
    if self.sampler is not None:
       ^^^^^^^^^^^^
AttributeError: 'LlamaModel' object has no attribute 'sampler'
ERROR:    Application startup failed. Exiting.
^CTraceback (most recent call last):
  File "/pythonITD/PythonAssistance/start_llm_loader.py", line 178, in <module>
    main()
  File "/pythonITD/PythonAssistance/start_llm_loader.py", line 155, in main
    ok = wait_for_health(host, port)
         ^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/pythonITD/PythonAssistance/start_llm_loader.py", line 57, in wait_for_health
    time.sleep(2)
KeyboardInterrupt
