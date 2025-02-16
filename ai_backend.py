import os
from flask import Flask, request, jsonify
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Retrieve OpenAI API key from environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    raise ValueError("Missing OpenAI API Key! Set it in the .env file.")

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)

app = Flask(__name__)

@app.route("/generate_definition", methods=["GET"])
def generate_definition():
    topic = request.args.get("topic")
    if not topic:
        return jsonify({"error": "Topic is required"}), 400

    response = client.chat.completions.create(
        model="gpt-4-turbo",
        messages=[
            {"role": "system", "content": "Provide a concise and beginner-friendly definition for the given math topic."},
            {"role": "user", "content": f"Define {topic} in a simple way."}
        ],
        max_tokens=100
    )
    
    definition = response.choices[0].message.content.strip()
    return jsonify({"definition": definition})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
