document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ DOM fully loaded and ready!");

    async function fetchData(topic) {
        console.log("Fetching definition for:", topic);
        
        // ✅ Find the #definition element
        const definitionElement = document.getElementById("definition");
        if (!definitionElement) {
            console.error("❌ Error: Element with ID 'definition' not found.");
            return;
        }

        try {
            // ✅ Format topic name (match Flask dictionary keys)
            const formattedTopic = topic.toLowerCase().replace(/ /g, "_");

            // ✅ Fetch Definition from Flask API
            const response = await fetch(`/get_definition?topic=${formattedTopic}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Definition Response:", data);

            // ✅ Update the middle column with the fetched definition
            if (data.definition) {
                definitionElement.innerText = data.definition;
            } else {
                definitionElement.innerText = "Definition not available.";
            }

        } catch (error) {
            console.error("❌ Fetching Error:", error);
            definitionElement.innerText = "Error fetching definition.";
        }
    }

    // ✅ Make fetchData function globally accessible
    window.fetchData = fetchData;
});
