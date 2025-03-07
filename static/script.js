// Wait until the entire HTML document has been loaded and parsed
document.addEventListener("DOMContentLoaded", function () {
    // Log a message to the console indicating that the DOM is fully loaded
    console.log("DOM fully loaded and ready");

    // ----------------------------------------
    // Existing functions for fetching definitions, playing audio, etc.
    // ----------------------------------------

    // Define an asynchronous function to fetch and display a definition for a given topic
    async function fetchDefinition(topic) {
        // Log the topic for which a definition is being fetched
        console.log("Fetching definition for:", topic);
        // Get the HTML element with the ID "definition" where the definition will be shown
        const definitionElement = document.getElementById("definition");
        // If the element is not found, log an error and exit the function
        if (!definitionElement) {
            console.error("❌ Error: Element with ID 'definition' not found.");
            return;
        }
        // Define a set of static definitions mapped by topic keys
        const staticDefinitions = {
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
        };
        // Format the topic string to match the keys in the staticDefinitions object:
        // Convert to lowercase and replace spaces with underscores.
        const formattedTopic = topic.toLowerCase().replace(/ /g, "_");
        // If a definition exists for the formatted topic, update the element's text with that definition
        if (staticDefinitions[formattedTopic]) {
            definitionElement.innerText = staticDefinitions[formattedTopic];
        } else {
            // Otherwise, display a message indicating that the definition is not available
            definitionElement.innerText = "Definition not available.";
        }
    }

    // Define another asynchronous function that can be used to fetch data for a given topic
    async function fetchData(topic) {
        // Log that a definition is being fetched (same as fetchDefinition)
        console.log("Fetching definition for:", topic);
        // Call fetchDefinition to get and display the definition
        await fetchDefinition(topic);
        // Additional logic for fetching data could be added here if needed
    }

    // Define a function to use speech synthesis to play the definition aloud
    function playDefinition() {
        // Get the text inside the element with the ID "definition"
        const definitionText = document.getElementById("definition").innerText;
        // If there is no valid definition text available, alert the user and exit the function
        if (!definitionText || definitionText === "Select a topic to see the definition.") {
            alert("❌ No definition available to read.");
            return;
        }
        // Stop any currently playing audio to avoid overlap
        stopAudio();
        // Create a new SpeechSynthesisUtterance object for the definition text
        let speechSynthesisUtterance = new SpeechSynthesisUtterance(definitionText);
        // Calculate the total number of words in the definition text for progress tracking
        let totalLength = definitionText.split(" ").length;
        // Initialize a counter for how many words have been spoken
        let wordsSpoken = 0;
        // Set up an interval that will update the audio progress every 500 milliseconds
        let speakingInterval = setInterval(() => {
            // Increment the word counter
            wordsSpoken++;
            // Calculate progress as a percentage of words spoken relative to the total words
            let progress = Math.min((wordsSpoken / totalLength) * 100, 100);
            // Update the progress bar element with the new progress value
            document.getElementById("audio-progress").value = progress;
            // Update the percentage text element to show the rounded percentage
            document.getElementById("audio-percentage").innerText = Math.round(progress) + "%";
        }, 500);
        // Set an event handler for when the speech starts
        speechSynthesisUtterance.onstart = () => {
            // Reset progress display to 0% when speech starts
            document.getElementById("audio-progress").value = 0;
            document.getElementById("audio-percentage").innerText = "0%";
        };
        // Set an event handler for when the speech ends
        speechSynthesisUtterance.onend = () => {
            // Clear the progress interval to stop updating progress
            clearInterval(speakingInterval);
            // Set progress display to 100% to indicate completion
            document.getElementById("audio-progress").value = 100;
            document.getElementById("audio-percentage").innerText = "100%";
        };
        // Start the speech synthesis process to read the definition aloud
        window.speechSynthesis.speak(speechSynthesisUtterance);
    }

    // Define a function to stop any currently playing audio
    function stopAudio() {
        // Cancel the current speech synthesis, stopping the audio immediately
        window.speechSynthesis.cancel();
        // Reset the progress bar and percentage display to 0%
        document.getElementById("audio-progress").value = 0;
        document.getElementById("audio-percentage").innerText = "0%";
    }

    // Expose functions globally so they can be called from HTML elements (e.g., via onclick attributes)
    window.fetchData = fetchData;
    window.playDefinition = playDefinition;
    window.stopAudio = stopAudio;
});

// Second DOMContentLoaded event for chat functionality
document.addEventListener("DOMContentLoaded", function () {
    // Get the chat input field element by its ID
    const chatInput = document.getElementById("chatInput");
    // Get the chat box element where messages will be displayed
    const chatBox = document.getElementById("chatBox");

    // Create a global function to send a chat message
    window.sendMessage = function() {
        // Get and trim the user input from the chat input field
        const userMessage = chatInput.value.trim();
        // If the input is empty after trimming, do nothing and exit the function
        if (!userMessage) return;

        // Display the user's message in the chat box with a "user" sender label
        displayMessage(userMessage, "user");

        // Send the user message to the server API endpoint using fetch, properly encoding the query
        fetch(`/ask?query=${encodeURIComponent(userMessage)}`)
            .then(response => response.json())  // Parse the JSON response from the server
            .then(data => {
                // Log the API response to the console for debugging
                console.log("API Response:", data);
                // If the API response contains an answer, display it as a message from the "bot"
                if (data.answer) {
                    displayMessage(data.answer, "bot");
                } else {
                    // If no answer was received, display an error message from the bot
                    displayMessage("Error: No response received.", "bot");
                }
            })
            // If the fetch operation fails, catch the error and log it, then display an error message
            .catch(error => {
                console.error("Fetch error:", error);
                displayMessage("Error: Could not fetch response.", "bot");
            });

        // Clear the chat input field after sending the message
        chatInput.value = "";
    };

    // Define a helper function to display a message in the chat box
    function displayMessage(message, sender) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", sender);

    // Allow MathJax rendering by using innerHTML instead of textContent
    messageElement.innerHTML = message;

    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;

    // Re-render MathJax whenever a new message is added
    MathJax.typesetPromise([messageElement]).catch((err) => console.log("MathJax Error:", err));
}

});
