// Wait until the entire HTML document has been loaded and parsed
document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded and ready");

    // Function to fetch and display static definitions
    async function fetchDefinition(topic) {
        console.log("Fetching definition for:", topic);
        const definitionElement = document.getElementById("definition");
        if (!definitionElement) {
            console.error("❌ Error: Element with ID 'definition' not found.");
            return;
        }
        const staticDefinitions = {
            "integers": "Whole numbers that can be positive, negative, or zero.",
            "fractions": "Numbers that show parts of a whole using two numbers.",
            "decimals": "Numbers with a dot that show parts of a whole.",
            "percents": "A way to compare a number to 100.",
            "real_numbers": "All numbers that can be written on a number line.",
            "signed_numbers": "Numbers that have a plus (+) or minus (-) sign.",
            "linear_equations": "Math sentences with an equal sign that form a straight line.",
            "polynomials": "Math expressions with numbers, letters, and exponents.",
            "factoring": "Breaking a number or expression into smaller parts."
        };
        // Format the topic key: lowercase and replace spaces with underscores
        const formattedTopic = topic.toLowerCase().replace(/ /g, "_");
        if (staticDefinitions[formattedTopic]) {
            definitionElement.innerText = staticDefinitions[formattedTopic];
        } else {
            definitionElement.innerText = "Definition not available.";
        }
    }

    async function fetchData(topic) {
        console.log("Fetching definition for:", topic);
        await fetchDefinition(topic);
    }

    function playDefinition() {
        const definitionText = document.getElementById("definition").innerText;
        if (!definitionText || definitionText === "Select a topic to see the definition.") {
            alert("❌ No definition available to read.");
            return;
        }
        stopAudio();
        let speechSynthesisUtterance = new SpeechSynthesisUtterance(definitionText);
        let totalLength = definitionText.split(" ").length;
        let wordsSpoken = 0;
        let speakingInterval = setInterval(() => {
            wordsSpoken++;
            let progress = Math.min((wordsSpoken / totalLength) * 100, 100);
            document.getElementById("audio-progress").value = progress;
            document.getElementById("audio-percentage").innerText = Math.round(progress) + "%";
        }, 500);
        speechSynthesisUtterance.onstart = () => {
            document.getElementById("audio-progress").value = 0;
            document.getElementById("audio-percentage").innerText = "0%";
        };
        speechSynthesisUtterance.onend = () => {
            clearInterval(speakingInterval);
            document.getElementById("audio-progress").value = 100;
            document.getElementById("audio-percentage").innerText = "100%";
        };
        window.speechSynthesis.speak(speechSynthesisUtterance);
    }

    function stopAudio() {
        window.speechSynthesis.cancel();
        document.getElementById("audio-progress").value = 0;
        document.getElementById("audio-percentage").innerText = "0%";
    }

    // Expose functions globally for HTML onClick attributes
    window.fetchData = fetchData;
    window.playDefinition = playDefinition;
    window.stopAudio = stopAudio;
});

// Chat functionality and Markdown fixes
document.addEventListener("DOMContentLoaded", function () {
    const chatInput = document.getElementById("chatInput");
    const chatBox = document.getElementById("chatBox");

    // Helper function to sanitize math delimiters:
    // Converts block math delimiters (\[...\]) into inline math (\(...\))
    function sanitizeMathMessage(text) {
        return text.replace(/\\\[(.*?)\\\]/g, "\\($1\\)");
    }

    window.sendMessage = function() {
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

        // Sanitize the user message for math delimiters
        const sanitizedUserMessage = sanitizeMathMessage(userMessage);
        displayMessage(sanitizedUserMessage, "user");

        // Set the topic value. This could be dynamic based on user selection.
        const topic = "linear equations";

        // Fetch chat response from the backend
        fetch(`/chat?topic=${encodeURIComponent(topic)}&usermessage=${encodeURIComponent(userMessage)}`)
            .then(response => response.text())
            .then(data => {
                console.log("API Response:", data);
                // Sanitize the response from the backend
                const sanitizedData = sanitizeMathMessage(data);
                displayMessage(sanitizedData, "bot");
            })
            .catch(error => {
                console.error("Fetch error:", error);
                displayMessage("Error: Could not fetch response.", "bot");
            });

        chatInput.value = "";
    };

    // Allow sending a message with the Enter key
    chatInput.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }
    });

    function displayMessage(message, sender) {
        const messageElement = document.createElement("div");
        messageElement.classList.add("message", sender);
        // Use innerHTML so MathJax can process LaTeX delimiters
        messageElement.innerHTML = message;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;

        // Trigger MathJax typesetting if it's loaded
        if (window.MathJax) {
            window.MathJax.typeset();
        }
    }
});
