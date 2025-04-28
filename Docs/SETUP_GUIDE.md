Math Tutor App - Setup Guide

Welcome! This guide will help you set up and run the Math Tutor App on your local machine.

Requirements

Docker

Java 17 or later

Maven (comes with project via mvnw script)

1. Clone the Repository

git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name

2. Start the Database and Ollama (AI Server)

Use Docker Compose to start the PostgreSQL (pgvector) database and Ollama server.

docker compose up -d

This will start two services:

Ollama at http://localhost:11434

PostgreSQL with pgvector at localhost:5432

3. Run the Spring Boot Application

Make sure you are in the project root directory.

On Mac/Linux:

./mvnw spring-boot:run

On Windows:

mvnw.cmd spring-boot:run

The application will start at:

http://localhost:8080

4. Frontend (HTML + JavaScript)

Open the index.html file in a browser:

./index.html

If you prefer, you can also serve it locally using any simple server (like VSCode Live Server extension).

5. Configuration Files

application.properties

Configures database connection.

Configures Ollama API connection.

compose.yaml

Defines Docker services (Ollama + pgvector database).

prompt_template.txt

Defines how the AI tutor responds to students.

6. Important Notes

Make sure Docker is running before you execute docker compose up.

The DocsETL.java component will automatically read and process PDF documents into the database on app startup.

If you want to add more topics, you can modify the topics list in index.html and script.js.

7. Helpful Commands

Stop Docker services:

docker compose down

Build the project manually (if needed):

./mvnw clean package

8. Project Creators

Ramon Baez - GitHub

Jonathan Costigan - GitHub

Patrick Reed - GitHub

9. Troubleshooting

Port 5432 or 11434 already in use?

Stop other Docker containers or PostgreSQL instances.

Spring Boot app fails to connect to the database?

Check if Docker services are running (docker ps).

Website can't fetch answers?

Make sure the backend is running on localhost:8080.