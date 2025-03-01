// Wait until the entire HTML document has been loaded and parsed
// Ensures the script runs only after the DOM is fully available
document.addEventListener("DOMContentLoaded", function () {
    // Log a message indicating the DOM is ready
    console.log("DOM fully loaded and ready");

    // ----------------------------------------
    // Existing functions for fetching definitions, playing audio, etc.
    // ----------------------------------------

    // Function to fetch a static definition for a given topic
    async function fetchDefinition(topic) {
        // Log the requested topic
        console.log("Fetching definition for:", topic);

        // Get the definition display element
        const definitionElement = document.getElementById("definition");

        // Check if the definition element exists in the DOM
        if (!definitionElement) {
            console.error("❌ Error: Element with ID 'definition' not found.");
            return;
        }

        // Predefined definitions for different mathematical topics
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

        // Format the topic string to match keys in staticDefinitions
        const formattedTopic = topic.toLowerCase().replace(/ /g, "_");

        // Display the definition if found; otherwise, show a default message
        if (staticDefinitions[formattedTopic]) {
            definitionElement.innerText = staticDefinitions[formattedTopic];
        } else {
            definitionElement.innerText = "Definition not available.";
        }
    }

    // Function to fetch definition data (placeholder for future extensions)
    async function fetchData(topic) {
        // Log the requested topic
        console.log("Fetching definition for:", topic);

        // Call the fetchDefinition function to display the definition
        await fetchDefinition(topic);
        // Additional logic can be added here to fetch examples or more data
    }

    // Function to play the definition text using speech synthesis
    function playDefinition() {
        // Get the text content of the definition
        const definitionText = document.getElementById("definition").innerText;

        // Check if a definition is available before proceeding
        if (!definitionText || definitionText === "Select a topic to see the definition.") {
            alert("❌ No definition available to read.");
            return;
        }

        // Stop any ongoing speech synthesis
        stopAudio();

        // Create a speech synthesis utterance object
        let speechSynthesisUtterance = new SpeechSynthesisUtterance(definitionText);

        // Get the total number of words in the definition
        let totalLength = definitionText.split(" ").length;
        let wordsSpoken = 0;

        // Update audio progress display as the speech plays
        let speakingInterval = setInterval(() => {
            wordsSpoken++;
            let progress = Math.min((wordsSpoken / totalLength) * 100, 100);
            document.getElementById("audio-progress").value = progress;
            document.getElementById("audio-percentage").innerText = Math.round(progress) + "%";
        }, 500);

        // Reset progress when speech starts
        speechSynthesisUtterance.onstart = () => {
            document.getElementById("audio-progress").value = 0;
            document.getElementById("audio-percentage").innerText = "0%";
        };

        // Complete progress when speech ends
        speechSynthesisUtterance.onend = () => {
            clearInterval(speakingInterval);
            document.getElementById("audio-progress").value = 100;
            document.getElementById("audio-percentage").innerText = "100%";
        };

        // Start speech synthesis
        window.speechSynthesis.speak(speechSynthesisUtterance);
    }

    // Function to stop any ongoing speech synthesis
    function stopAudio() {
        window.speechSynthesis.cancel();
        document.getElementById("audio-progress").value = 0;
        document.getElementById("audio-percentage").innerText = "0%";
    }

    // Expose functions globally for usage in the HTML page
    window.fetchData = fetchData;
    window.playDefinition = playDefinition;
    window.stopAudio = stopAudio;
});
