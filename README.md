from flask import Flask
from flask_cors import CORS
import os
from routes.general import general
from routes.project import project
from routes.ai import ai

app = Flask(__name__)

# IMPORTANT: You MUST have a secret key for session["session_id"] to work!
app.secret_key = "pyassist_super_secret_key" 

# Enable CORS for your local frontend port (usually 5500 for Live Server)
CORS(app, supports_credentials=True, origins=["http://127.0.0.1:5500", "http://localhost:5500"])

# Registering with url_prefix='/api' makes everything match config.js
app.register_blueprint(general, url_prefix='/api')
app.register_blueprint(project, url_prefix='/api')
app.register_blueprint(ai, url_prefix='/api')

if __name__ == "__main__":
    # Ensure port matches config.js (8504)
    app.run(host="0.0.0.0", port=8504, debug=True)
