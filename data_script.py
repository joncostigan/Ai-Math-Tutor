# File: data_script.py

# Import the dotenv module to load environment variables from a .env file.
from dotenv import load_dotenv

# Load environment variables (e.g., API keys) from the .env file.
load_dotenv()

# Import necessary Python libraries.
import os  # Provides functions to interact with the operating system.
import sqlite3  # Provides SQLite database functionalities.
import numpy as np  # Import NumPy for numerical operations.

# Import necessary modules from LangChain for document processing and embeddings.
from langchain_community.document_loaders import PyPDFLoader  # Loads PDF documents.
from langchain.text_splitter import RecursiveCharacterTextSplitter  # Splits text into chunks.
from langchain_community.embeddings import OpenAIEmbeddings  # Generates embeddings using OpenAI.
from langchain.chains import RetrievalQA  # Retrieval-based QA system.
from langchain_community.llms import OpenAI  # Uses OpenAI's language model.
from langchain.docstore.document import Document  # Represents a document object.
from langchain.schema import BaseRetriever  # Base class for retrieval systems.


def main():
    # Get the directory of the current script.
    script_dir = os.path.dirname(__file__)  # Directory of this script (main directory).

    # Construct the full path to the PDF file.
    pdf_path = os.path.join(script_dir, "Data", "Prealgebra2.pdf")

    # 1. Load the PDF file using PyPDFLoader.
    loader = PyPDFLoader(pdf_path)
    documents = loader.load()

    # 2. Split the document into smaller text chunks.
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    docs = text_splitter.split_documents(documents)

    # 3. Initialize the OpenAI embeddings model (API key is loaded from .env file).
    embeddings = OpenAIEmbeddings(model="text-embedding-ada-002")

    # Function to generate embeddings for a given text.
    def embed_text(text):
        return embeddings.embed_query(text)

    # 4. Prepare data for database storage by creating tuples of (text_chunk, embedding_bytes).
    data_to_store = []
    for doc in docs:
        emb = embed_text(doc.page_content)  # Generate embeddings.
        emb_bytes = np.array(emb, dtype=np.float32).tobytes()  # Convert embeddings to byte format.
        data_to_store.append((doc.page_content, emb_bytes))  # Store text and embedding.

    # 5. Create (or connect to) an SQLite database and set up the table for storing embeddings.
    conn = sqlite3.connect("embeddings.db")  # Connect to SQLite database.
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pdf_embeddings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text_chunk TEXT,
            embedding BLOB
        )
    """)
    conn.commit()  # Commit the transaction.

    # 6. Insert the processed text chunks and embeddings into the database.
    cursor.executemany(
        "INSERT INTO pdf_embeddings (text_chunk, embedding) VALUES (?, ?)",
        data_to_store
    )
    conn.commit()  # Commit the transaction.

    # 7. Define functions for retrieving embeddings from the database and performing similarity searches.
    def load_embeddings():
        cursor.execute("SELECT id, text_chunk, embedding FROM pdf_embeddings")  # Fetch all records.
        results = cursor.fetchall()
        items = []
        for record in results:
            rec_id, text_chunk, emb_bytes = record
            emb = np.frombuffer(emb_bytes, dtype=np.float32)  # Convert byte data back to numpy array.
            items.append({"id": rec_id, "text": text_chunk, "embedding": emb})
        return items

    # Function to compute cosine similarity between two vectors.
    def cosine_similarity(a, b):
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

    # Function to retrieve relevant text chunks based on a query.
    def retrieve(query, top_k=3):
        query_emb = np.array(embed_text(query), dtype=np.float32)  # Convert query to embeddings.
        items = load_embeddings()  # Load stored embeddings from database.
        scored = [(item, cosine_similarity(query_emb, item["embedding"])) for item in
                  items]  # Compute similarity scores.
        scored = sorted(scored, key=lambda x: x[1], reverse=True)  # Sort by highest similarity.
        return [item["text"] for item, score in scored[:top_k]]  # Return top-k matching texts.

    # 8. Create a custom retriever class by subclassing BaseRetriever.
    class CustomRetriever(BaseRetriever):
        def get_relevant_documents(self, query: str):
            texts = retrieve(query)  # Retrieve relevant text chunks.
            return [Document(page_content=t) for t in texts]  # Wrap them in Document objects.

        @property
        def search_kwargs(self):
            return {}  # Return any additional keyword arguments for searching (empty in this case).

    retriever = CustomRetriever()  # Instantiate the custom retriever.
    llm = OpenAI(temperature=0)  # Load OpenAI language model with temperature 0 (deterministic responses).

    # 9. Build a RetrievalQA chain using the retriever and language model.
    qa_chain = RetrievalQA.from_chain_type(llm=llm, chain_type="stuff", retriever=retriever)

    # 10. Run a sample query using the QA chain.
    query = "Explain the concept of whole numbers."
    result = qa_chain.run(query)
    print("Answer:", result)  # Print the retrieved answer.

    # Close the database connection after execution.
    conn.close()


# Run the script only if it's executed as the main program.
if __name__ == "__main__":
    main()
