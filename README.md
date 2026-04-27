((PythonAssistance) ) [mia66375@svdwh008 PythonAssistance]$ /bin/python /pythonITD/PythonAssistance/app.py
✅ Storage initialized at: /pythonITD/askpbai/storage_volume/logs/PyAssist
Traceback (most recent call last):
  File "/pythonITD/PythonAssistance/app.py", line 10, in <module>
    from routes.general import general
  File "/pythonITD/PythonAssistance/routes/general.py", line 2, in <module>
    from core.audit.chat_audit import write_audit_log
  File "/pythonITD/PythonAssistance/core/audit/chat_audit.py", line 9, in <module>
    from .resolver import audit_dir_for
  File "/pythonITD/PythonAssistance/core/audit/resolver.py", line 10, in <module>
    def audit_dir_for(helper_code: str, username: str | None = None) -> Path:
TypeError: unsupported operand type(s) for |: 'type' and 'NoneType'
((PythonAssistance) ) [mia66375@svdwh008 PythonAssistance]$ 
