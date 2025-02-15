async function fetchDefinition() {
    const topic = document.getElementById("topic").value;
    const definitionElement = document.getElementById("definition");

    if (!topic) {
        definitionElement.style.display = "none";
        return;
    }

    try {
        // Simulate an API request to fetch an AI-generated definition
        const response = await fetch(`https://api.example.com/generate_definition?topic=${topic}`);
        const data = await response.json();

        // Display the fetched definition
        definitionElement.innerText = data.definition;
        definitionElement.style.display = "block";
    } catch (error) {
        console.error("Error fetching definition:", error);
        definitionElement.innerText = "Failed to load definition. Please try again.";
        definitionElement.style.display = "block";
    }
}
