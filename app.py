'''Python Assistant - AI-powered Python code analysis tool.'''

import os
from flask import Flask
from flask_cors import CORS

from routes.general import general
from routes.project import load_project
from routes.ai import ai

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "change-this-in-production")
CORS(app, supports_credentials=True)  # credentials needed for session cookies

app.register_blueprint(general)
app.register_blueprint(project)
app.register_blueprint(ai)

if __name__ == "__main__":
    print("Server running at http://localhost:8504")
    app.run(host="0.0.0.0", port=8504, debug=True)


    
