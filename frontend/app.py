from flask import Flask, render_template, request, jsonify  # Import Flask and its helper functions for web development
from openai import OpenAI  # Import OpenAI client for interacting with the OpenAI API (not used in this snippet)
from dotenv import load_dotenv  # Import load_dotenv to load environment variables from a .env file
import os  # Import os module for operating system functionalities, such as accessing environment variables

# Load environment variables from a .env file into the system environment
load_dotenv()

# Initialize the Flask application instance
app = Flask(__name__)

# Define the route for the home page ("/")
@app.route("/")
def home():
    # Render and return the main.html template, which should be located in the 'templates/' folder
    return render_template("main.html")

# Check if the script is run directly (and not imported as a module)
if __name__ == "__main__":
    # Run the Flask development server on all network interfaces (0.0.0.0) at port 5000 with debug mode enabled
    app.run(host="0.0.0.0", port=5000, debug=True)
