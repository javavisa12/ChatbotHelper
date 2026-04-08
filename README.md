'''Python Assistant - AI-powered Python code analysis tool.'''

import os
from flask import Flask
from flask_cors import CORS

from routes.general import general
from routes.project import project
from routes.ai import ai

app = Flask(__name__)

# 1. FIXED: Sessions require a secret key to function
app.secret_key = "pyassist-internal-dev-key" 

# 2. FIXED: Added explicit origins to ensure CORS doesn't block local dev ports
CORS(app, supports_credentials=True, origins=["http://localhost:5500", "http://127.0.0.1:5500"])

# 3. FIXED: Using url_prefix keeps your URLs consistent with config.js
app.register_blueprint(general, url_prefix='/api')
app.register_blueprint(project, url_prefix='/api')
app.register_blueprint(ai, url_prefix='/api')

if __name__ == "__main__":
    # 4. FIXED: Port changed to 8504 to match your config.js
    print("Server running at http://localhost:8504")
    app.run(host="0.0.0.0", port=8504, debug=True)
