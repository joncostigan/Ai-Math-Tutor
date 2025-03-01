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

// Second DOMContentLoaded event for chat functionality
document.addEventListener("DOMContentLoaded", function () {
    const chatInput = document.getElementById("chatInput");
    const chatBox = document.getElementById("chatBox");

    window.sendMessage = function() {
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

        displayMessage(userMessage, "user");

        // Set the topic value. This could be dynamic based on user selection.
        const topic = "linear_equations";

        // Updated fetch call to communicate with your backend at /chat
        fetch(`/chat?topic=${encodeURIComponent(topic)}&usermessage=${encodeURIComponent(userMessage)}`)
            .then(response => response.text()) // Adjusted to .text() if backend returns plain text.
            .then(data => {
                console.log("API Response:", data);
                displayMessage(data, "bot");
            })
            .catch(error => {
                console.error("Fetch error:", error);
                displayMessage("Error: Could not fetch response.", "bot");
            });

        chatInput.value = "";
    };

    function displayMessage(message, sender) {
        const messageElement = document.createElement("div");
        messageElement.classList.add("message", sender);
        messageElement.textContent = message;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});
