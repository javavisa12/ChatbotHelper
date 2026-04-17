"""Python Assistant - AI-powered Python code analysis tool."""

import os
from flask import Flask
from flask_cors import CORS
from config import ensure_storage_dirs



from routes.general import general
from routes.project import project
from routes.ai import ai
from routes.upload import upload


ensure_storage_dirs()
app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "change-this-in-production")
CORS(app, supports_credentials=True)  # credentials needed for session cookies

# Register blueprints
app.register_blueprint(project)
app.register_blueprint(ai)
app.register_blueprint(general)
app.register_blueprint(upload)



@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "Python Assistant"}, 200


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return {"error": "Endpoint not found"}, 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    return {"error": "Internal server error"}, 500


if __name__ == "__main__":
    print("Server running at http://localhost:8504")
    app.run(host="0.0.0.0", port=8504, debug=True)
    
    
