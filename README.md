- Run app.py (port:5000)
- runtime : llama_cpp_python
- model : tinyllama, phi-3 mini 

both run in same port number 


Traceback (most recent call last):
  File "/home/PBB/mia66375/.local/lib/python3.9/site-packages/httpx/_transports/default.py", line 101, in map_httpcore_exceptions
    yield
  File "/home/PBB/mia66375/.local/lib/python3.9/site-packages/httpx/_transports/default.py", line 250, in handle_request
    resp = self._pool.handle_request(req)
  File "/home/PBB/mia66375/.local/lib/python3.9/site-packages/httpcore/_sync/connection_pool.py", line 256, in handle_request
    raise exc from None
  File "/home/PBB/mia66375/.local/lib/python3.9/site-packages/httpcore/_sync/connection_pool.py", line 236, in handle_request
    response = connection.handle_request(
  File "/home/PBB/mia66375/.local/lib/python3.9/site-packages/httpcore/_sync/connection.py", line 101, in handle_request
    raise exc
  File "/home/PBB/mia66375/.local/lib/python3.9/site-packages/httpcore/_sync/connection.py", line 78, in handle_request
    stream = self._connect(request)
  File "/home/PBB/mia66375/.local/lib/python3.9/site-packages/httpcore/_sync/connection.py", line 124, in _connect
    stream = self._network_backend.connect_tcp(**kwargs)
  File "/home/PBB/mia66375/.local/lib/python3.9/site-packages/httpcore/_backends/sync.py", line 215, in connect_tcp
    sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
  File "/usr/lib64/python3.9/contextlib.py", line 137, in __exit__
    self.gen.throw(typ, value, traceback)
  File "/home/PBB/mia66375/.local/lib/python3.9/site-packages/httpcore/_exceptions.py", line 14, in map_exceptions
    raise to_exc(exc) from exc
httpcore.ConnectError: [Errno -2] Name or service not known

The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "/pythonITD/PythonAssistance/app.py", line 21, in <module>
    llm = Llama.from_pretrained(
  File "/home/PBB/mia66375/.local/lib/python3.9/site-packages/llama_cpp/llama.py", line 2279, in from_pretrained
    for file in hffs.ls(repo_id, recursive=True)
  File "/home/PBB/mia66375/.local/lib/python3.9/site-packages/huggingface_hub/hf_file_system.py", line 534, in ls
    resolved_path = self.resolve_path(path, revision=revision)
  File "/home/PBB/mia66375/.local/lib/python3.9/site-packages/huggingface_hub/hf_file_system.py", line 364, in resolve_path
    repo_and_revision_exist, err = self._repo_and_revision_exist(repo_type, repo_id, revision)
  File "/home/PBB/mia66375/.local/lib/python3.9/site-packages/huggingface_hub/hf_file_system.py", line 261, in _repo_and_revision_exist
    self._api.repo_info(
  File "/home/PBB/mia66375/.local/lib/python3.9/site-packages/huggingface_hub/utils/_validators.py", line 89, in _inner_fn
    return fn(*args, **kwargs)
  File "/home/PBB/mia66375/.local/lib/python3.9/site-packages/huggingface_hub/hf_api.py", line 3285, in repo_info
    return method(
  File "/home/PBB/mia66375/.local/lib/python3.9/site-packages/huggingface_hub/utils/_validators.py", line 89, in _inner_fn
    return fn(*args, **kwargs)
  File "/home/PBB/mia66375/.local/lib/python3.9/site-packages/huggingface_hub/hf_api.py", line 3020, in model_info
    r = get_session().get(path, headers=headers, timeout=timeout, params=params)
  File "/home/PBB/mia66375/.local/lib/python3.9/site-packages/httpx/_client.py", line 1053, in get
    return self.request(
  File "/home/PBB/mia66375/.local/lib/python3.9/site-packages/httpx/_client.py", line 825, in request
    return self.send(request, auth=auth, follow_redirects=follow_redirects)
  File "/home/PBB/mia66375/.local/lib/python3.9/site-packages/httpx/_client.py", line 914, in send
    response = self._send_handling_auth(
  File "/home/PBB/mia66375/.local/lib/python3.9/site-packages/httpx/_client.py", line 942, in _send_handling_auth
    response = self._send_handling_redirects(
  File "/home/PBB/mia66375/.local/lib/python3.9/site-packages/httpx/_client.py", line 979, in _send_handling_redirects
    response = self._send_single_request(request)
  File "/home/PBB/mia66375/.local/lib/python3.9/site-packages/httpx/_client.py", line 1014, in _send_single_request
    response = transport.handle_request(request)
  File "/home/PBB/mia66375/.local/lib/python3.9/site-packages/httpx/_transports/default.py", line 250, in handle_request
    resp = self._pool.handle_request(req)
  File "/usr/lib64/python3.9/contextlib.py", line 137, in __exit__
    self.gen.throw(typ, value, traceback)
  File "/home/PBB/mia66375/.local/lib/python3.9/site-packages/httpx/_transports/default.py", line 118, in map_httpcore_exceptions
    raise mapped_exc(message) from exc
httpx.ConnectError: [Errno -2] Name or service not known
