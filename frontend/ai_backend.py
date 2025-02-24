import os  # Import the os module to interact with environment variables
from flask import Flask, request, jsonify, render_template  # Import Flask modules for web app functionality
from flask_cors import CORS  # Import CORS to handle cross-origin requests
from openai import OpenAI  # Import OpenAI API for AI-generated content
from dotenv import load_dotenv  # Import dotenv to load environment variables from a .env file

# Load environment variables from .env file
load_dotenv()

# Retrieve the OpenAI API key from the environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Raise an error if the API key is missing
if not OPENAI_API_KEY:
    raise ValueError("❌ Missing OpenAI API Key! Set it in the .env file.")

# Initialize OpenAI client with API key
client = OpenAI(api_key=OPENAI_API_KEY)

# Create a Flask application instance
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes to prevent cross-origin errors

# ✅ Static Definitions for Each Topic (Predefined responses)
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

SYLLABUS_TOPICS = ["Real Numbers", "Order of Operations", "Absolute Value", "Exponents", "Linear Equations", "Graphing Lines", "Inequalities", "Scientific Notation", "Polynomials", "Factoring", "Coordinate System", "Slopes", "Intercepts", "Simplifying Expressions"]

# Define the home route to serve the main HTML page
@app.route("/")
def home():
    return render_template("main.html")

# ✅ API Route: Return Static Definition for a Given Topic
@app.route("/get_definition", methods=["GET"])
def get_definition():
    topic = request.args.get("topic")  # Get the topic from the request URL
    if topic in STATIC_DEFINITIONS:  # Check if the topic exists in the predefined dictionary
        return jsonify({"definition": STATIC_DEFINITIONS[topic]})  # Return the definition as JSON
    
    print(f"❌ Topic not found: {topic}")  # Log an error message if the topic is not found
    return jsonify({"error": "❌ Topic not found"}), 404  # Return an error response

# ✅ API Route: Generate Example Problem Using OpenAI API
@app.route("/generate_example", methods=["GET"])
def generate_example():
    topic = request.args.get("topic")  # Get the topic from the request URL
    if not topic:  # Check if topic is missing
        return jsonify({"error": "❌ Topic is required"}), 400  # Return an error response

    try:
        # Make a request to OpenAI API to generate an example problem
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",  # Specify the AI model to use
            messages=[
                {"role": "system", "content": "Provide a structured math problem with clear formatting. Include both the problem and the solution, but hide the answer under 'Solution: (Hidden)'"},
                {"role": "user", "content": f"Generate a clear math problem for {topic}. Format it well with step-by-step structure."}
            ],
            max_tokens=150  # Limit the response length
        )

        example = response.choices[0].message.content.strip()  # Extract the generated response
        return jsonify({"example": example})  # Return the generated example as JSON

    except Exception as e:
        print(f"❌ Error fetching example: {e}")  # Log an error if the API call fails
        return jsonify({"error": "Failed to generate example"}), 500  # Return an error response

# ✅ API Route: Explain Math Concept Using OpenAI API
@app.route("/explain_math", methods=["GET"])
def explain_math():
    query = request.args.get("query")  # Get the query from the request URL
    if not query:  # Check if query is missing
        return jsonify({"error": "❌ Query is required"}), 400  # Return an error response

    query_lower = query.lower()
    if any(topic.lower() in query_lower for topic in SYLLABUS_TOPICS):
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Explain this math concept in a simple way suitable for a beginner, with examples."},
                    {"role": "user", "content": f"Explain {query} in detail with examples."}
                ],
                max_tokens=250
            )
            explanation = response.choices[0].message.content.strip()
            return jsonify({"explanation": explanation})  # Return the explanation as JSON
        except Exception as e:
            print(f"❌ Error explaining math concept: {e}")  # Log an error if the API call fails
            return jsonify({"error": "Failed to explain math concept"}), 500  # Return an error response

    return jsonify({"error": "This topic is beyond the scope of MAT 095."}), 400  # Return an error response if the topic is not in the syllabus

# Run the Flask application when executed directly
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)  # Start the server on port 5000 with debug mode enabled