# File: ai_backend.py

# Import necessary modules
import os  # Provides operating system-related functionality
import sqlite3  # SQLite database operations
import numpy as np  # Numerical operations

# Import Flask-related modules for web server functionality
from flask import Flask, request, jsonify, render_template  # Web framework
from flask_cors import CORS  # Enables Cross-Origin Resource Sharing (CORS)
from dotenv import load_dotenv  # Loads environment variables from a .env file

# Import LangChain components for conversational AI
from langchain.chat_models import ChatOpenAI  # OpenAI chat model
from langchain.embeddings.openai import OpenAIEmbeddings  # OpenAI embeddings for vector search
from langchain.chains import ConversationalRetrievalChain  # Conversational AI with memory and retrieval
from langchain.memory import ConversationBufferMemory  # Manages chat memory
from langchain.schema import BaseRetriever  # Base retriever for retrieving documents
from langchain.docstore.document import Document  # Represents text documents

# Load environment variables from the .env file
load_dotenv()

# Retrieve the OpenAI API key from environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Ensure the API key is set, otherwise raise an error
if not OPENAI_API_KEY:
    raise ValueError("❌ Missing OPENAI_API_KEY! Set it in your .env file.")

###################################
# Flask setup
###################################
app = Flask(__name__)  # Create a Flask web application instance
CORS(app)  # Enable CORS to allow cross-origin requests


###################################
# Database + Retrieval Logic
###################################
def load_embeddings():
    """Load text chunks + embeddings from embeddings.db."""
    # Connect to SQLite database
    conn = sqlite3.connect("embeddings.db")
    cursor = conn.cursor()

    # Fetch stored embeddings from the database
    cursor.execute("SELECT id, text_chunk, embedding FROM pdf_embeddings")
    rows = cursor.fetchall()

    items = []  # List to store retrieved data
    for rec_id, text_chunk, emb_bytes in rows:
        emb = np.frombuffer(emb_bytes, dtype=np.float32)  # Convert binary data to NumPy array
        items.append({"id": rec_id, "text": text_chunk, "embedding": emb})

    conn.close()  # Close database connection
    return items  # Return retrieved data


# Function to calculate cosine similarity between two vectors
def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


# Function to retrieve the most relevant text chunks for a query
def retrieve(query, top_k=3):
    """Embeds the query, finds top_k matching chunks from DB."""

    # Initialize OpenAI embeddings model
    embeddings = OpenAIEmbeddings(
        model="text-embedding-ada-002",
        openai_api_key=OPENAI_API_KEY
    )

    # Convert query into an embedding
    query_emb = np.array(embeddings.embed_query(query), dtype=np.float32)

    # Load stored embeddings from the database
    items = load_embeddings()

    # Compute cosine similarity between query and stored embeddings
    scored = [(item, cosine_similarity(query_emb, item["embedding"])) for item in items]

    # Sort results by highest similarity score
    scored.sort(key=lambda x: x[1], reverse=True)

    # Return the top_k most relevant text chunks
    return [item["text"] for item, score in scored[:top_k]]


# Custom retriever class that retrieves documents based on query
class CustomRetriever(BaseRetriever):
    """Simple retriever that returns Documents from the above 'retrieve' function."""

    def _get_relevant_documents(self, query: str):
        texts = retrieve(query)  # Get relevant text chunks
        return [Document(page_content=t) for t in texts]  # Return them as LangChain Document objects

    @property
    def search_kwargs(self):
        # Typically no extra search arguments needed
        return {}


###################################
# Build the ConversationalRetrievalChain
###################################
# 1) Create a ChatOpenAI LLM (pointing to the chat model endpoint)
chat_llm = ChatOpenAI(
    model_name="gpt-3.5-turbo",  # OpenAI model for chat-based applications
    openai_api_key=OPENAI_API_KEY,  # API key for authentication
    temperature=0  # Controls response randomness (0 = deterministic)
)

# 2) Create a memory for conversation
chat_memory = ConversationBufferMemory(
    memory_key="chat_history",  # Identifier for stored conversation history
    return_messages=True  # Ensures responses include memory messages
)

# 3) Create a retriever
my_retriever = CustomRetriever()  # Instantiate the custom retriever

# 4) Build the conversational retrieval chain
chat_chain = ConversationalRetrievalChain.from_llm(
    llm=chat_llm,  # Language model instance
    retriever=my_retriever,  # Document retriever
    memory=chat_memory,  # Conversation memory
    verbose=True  # Enables debug output
)


###################################
# Flask Routes (API Endpoints)
###################################

# Route for rendering the main webpage
@app.route("/")
def home():
    return render_template("main.html")  # Load the HTML template


# Route for handling user queries via GET requests
@app.route("/ask", methods=["GET"])
def ask():
    """
    Chat endpoint for the RAG-based conversation, with memory.
    Expects ?query=... in the URL.
    """

    # Get the user query from the request parameters
    user_query = request.args.get("query", "")

    # If query is empty, return an error message
    if not user_query:
        return jsonify({"error": "No query provided"}), 400

    try:
        # Pass the user query to the conversational retrieval chain
        result = chat_chain({"question": user_query})

        # Extract the answer from the result
        answer = result["answer"]  # Typically, the result contains {"answer": "...", "source_documents": [...]}

        return jsonify({"answer": answer})  # Return the answer as JSON
    except Exception as e:
        # Print error to console and return an error response
        print("Error in /ask route:", e)
        return jsonify({"error": str(e)}), 500


# Main entry point: Run the Flask application if executed directly
if __name__ == "__main__":
    app.run(debug=True, port=5000)  # Start Flask server on port 5000 in debug mode