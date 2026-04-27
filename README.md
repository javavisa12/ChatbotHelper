Traceback (most recent call last):
  File "/pythonITD/PythonAssistance/test_model_server.py", line 20, in <module>
    llm = Llama(
          ^^^^^^
  File "/pythonITD/PythonAssistance/lib64/python3.12/site-packages/llama_cpp/llama.py", line 374, in __init__
    internals.LlamaModel(
  File "/pythonITD/PythonAssistance/lib64/python3.12/site-packages/llama_cpp/_internals.py", line 58, in __init__
    raise ValueError(f"Failed to load model from file: {path_model}")
ValueError: Failed to load model from file: app/models/starcoder2-15b-Q8_0.gguf
Exception ignored in: <function LlamaModel.__del__ at 0x7f089e38b6a0>
Traceback (most recent call last):
  File "/pythonITD/PythonAssistance/lib64/python3.12/site-packages/llama_cpp/_internals.py", line 86, in __del__
    self.close()
  File "/pythonITD/PythonAssistance/lib64/python3.12/site-packages/llama_cpp/_internals.py", line 78, in close
    if self.sampler is not None:
       ^^^^^^^^^^^^
AttributeError: 'LlamaModel' object has no attribute 'sampler'
