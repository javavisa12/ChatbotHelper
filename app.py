from flask import Flask, jsonify
from flask_cors import CORS

from routes.general import general
from routes.project import project
from routes.ai import ai

app = Flask(__name__)
CORS(app)

app.register_blueprint(general)
app.register_blueprint(project)
app.register_blueprint(ai)

if __name__ == "__main__":
    print("Server running at http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)


@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({
        "status": "ok",
        "project_loaded": False
    })
