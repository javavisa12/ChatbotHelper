❌ Cannot connect to llm_loader at http://llm-loader:8000
Traceback (most recent call last):
  File "/pythonITD/PythonAssistance/app.py", line 7, in <module>
    from routes.general import general
  File "/pythonITD/PythonAssistance/routes/general.py", line 5, in <module>
    from llm.chat import chat
  File "/pythonITD/PythonAssistance/llm/chat.py", line 1, in <module>
    from llm.model import models
ImportError: cannot import name 'models' from 'llm.model' 
