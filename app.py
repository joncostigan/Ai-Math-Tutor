from flask import Flask, render_template, request, jsonify
from openai import OpenAI
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("main.html")  # Ensure main.html is inside the templates/ folder

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
