import os
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS  # ✅ Import CORS
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Retrieve API Key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    raise ValueError("❌ Missing OpenAI API Key! Set it in the .env file.")

app = Flask(__name__)
CORS(app)  # ✅ Enable CORS for all routes

# ✅ Static Definitions for Each Topic
STATIC_DEFINITIONS = {
    "real_numbers": "Real numbers include all rational and irrational numbers.",
    "order_of_operations": "The order of operations follows PEMDAS: Parentheses, Exponents, Multiplication & Division (left to right), Addition & Subtraction (left to right).",
    "absolute_value": "Absolute value represents the distance of a number from zero on the number line.",
    "exponents": "An exponent refers to the number of times a base number is multiplied by itself.",
    "linear_equations": "A linear equation is an equation that makes a straight line when graphed.",
    "graphing_lines": "Graphing lines involves plotting points that satisfy a linear equation on a coordinate plane.",
    "inequalities": "Inequalities express a range of values that satisfy an equation, using <, >, ≤, or ≥ symbols.",
    "scientific_notation": "Scientific notation is a way of writing very large or very small numbers using powers of 10.",
    "polynomials": "A polynomial is an expression consisting of variables, coefficients, and exponents combined using addition, subtraction, and multiplication.",
    "factoring": "Factoring is breaking down a complex expression into simpler terms that, when multiplied together, give the original expression."
}

@app.route("/")
def home():
    return render_template("main.html")

# ✅ API Route: Return Static Definition
@app.route("/get_definition", methods=["GET"])
def get_definition():
    topic = request.args.get("topic")
    if topic in STATIC_DEFINITIONS:
        return jsonify({"definition": STATIC_DEFINITIONS[topic]})
    
    print(f"❌ Topic not found: {topic}")
    return jsonify({"error": "❌ Topic not found"}), 404

# ✅ API Route: Generate Example Problem (Uses OpenAI)
@app.route("/generate_example", methods=["GET"])
def generate_example():
    topic = request.args.get("topic")
    if not topic:
        return jsonify({"error": "❌ Topic is required"}), 400

    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Provide a structured math problem with clear formatting. Include both the problem and the solution, but hide the answer under 'Solution: (Hidden)'"},
                {"role": "user", "content": f"Generate a clear math problem for {topic}. Format it well with step-by-step structure."}
            ],
            max_tokens=150
        )

        example = response.choices[0].message.content.strip()
        return jsonify({"example": example})

    except Exception as e:
        print(f"❌ Error fetching example: {e}")
        return jsonify({"error": "Failed to generate example"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
