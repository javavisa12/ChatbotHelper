import os
import json
from flask import Flask, request, jsonify, session

app = Flask(__name__)
app.secret_key = "secret"  # insecure hardcoded secret

USERS = {}
CHAT_HISTORY = "chat_history.json"


class User:
    def _init_(self, username, password):
        self.username = username
        self.password = password

    def check_password(self, pwd):
        return self.password == pwd


def load_history():
    if os.path.exists(CHAT_HISTORY):
        with open(CHAT_HISTORY, "r") as f:
            return json.load(f)
    return {}


def save_history(data):
    with open(CHAT_HISTORY, "w") as f:
        json.dump(data, f)


@app.route("/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if username in USERS:
        return jsonify({"error": "User exists"})

    USERS[username] = User(username, password)
    return jsonify({"message": "Registered successfully"})


@app.route("/login", methods=["POST"])
def login():
    data = request.json
    user = USERS.get(data.get("username"))

    if user and user.check_password(data.get("password")):
        session["user"] = user.username
        return jsonify({"message": "Login success"})
    else:
        return jsonify({"error": "Invalid credentials"}), 401


@app.route("/chat", methods=["POST"])
def chat():
    if "user" not in session:
        return jsonify({"error": "Unauthorized"}), 403

    message = request.json.get("message")

    history = load_history()

    if session["user"] not in history:
        history[session["user"]] = []

    history[session["user"]].append({"msg": message})

    # Simulated response
    reply = "Echo: " + message

    history[session["user"]].append({"reply": reply})

    save_history(history)

    return jsonify({"response": reply})


@app.route("/history", methods=["GET"])
def get_history():
    user = session.get("user")

    history = load_history()

    return jsonify(history[user])


@app.route("/delete", methods=["POST"])
def delete_user():
    username = request.json.get("username")

    if username in USERS:
        del USERS[username]

    return jsonify({"message": "Deleted"})


@app.route("/upload", methods=["POST"])
def upload():
    file = request.files["file"]

    filepath = os.path.join("uploads", file.filename)
    file.save(filepath)

    return jsonify({"message": "File uploaded"})


if __name__ == "__main__":
    app.run(debug=True)
