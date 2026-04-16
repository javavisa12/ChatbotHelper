((PythonAssistance) ) [mia66375@svdwh008 PythonAssistance]$ python app.py
✅ Connected to llm_loader — pool_total=1, pool_idle=1
✅ Project loader module initialized
   Session storage ready for 0 active sessions
Traceback (most recent call last):
  File "/pythonITD/PythonAssistance/app.py", line 13, in <module>
    from routes.upload import upload
  File "/pythonITD/PythonAssistance/routes/upload.py", line 4, in <module>
    from core.audit.file_audit import write_file_audit
  File "/pythonITD/PythonAssistance/core/audit/file_audit.py", line 38
    }
     ^
SyntaxError: expected 'except' or 'finally' block
