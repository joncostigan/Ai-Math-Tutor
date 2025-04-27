// Wait until the entire HTML document has been loaded and parsed
// Updated to include clearChat globally

const synth = window.speechSynthesis;
let voices;
let currentUtterance;

/**
 * Loads the available voices for speech synthesis.
 */
function loadVoices() {
    voices = synth.getVoices();
}


if ("onvoiceschanged" in synth) {
    synth.onvoiceschanged = loadVoices;
} else {
    loadVoices();
}





document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded and ready");

    /**
     * Fetches and displays a static definition for a given topic.
     * @param {string} topic - The topic for which the definition is fetched.
     */
    async function fetchDefinition(topic) {
        console.log("Fetching definition for:", topic);
        const definitionElement = document.getElementById("definition");
        if (!definitionElement) {
            console.error("❌ Error: Element with ID 'definition' not found.");
            return;
        }
        const staticDefinitions = {
            "integers": "Numbers without fractions or decimals, like -3, 0, or 7.",
            "fractions": "A way to show parts of a whole, written with a top and bottom number.",
            "decimals": "Numbers with a dot that show values smaller than one, like 0.5.",
            "percents": "A way to express parts out of 100, like 25% means 25 out of 100.",
            "real numbers": "All numbers that can be found on the number line, including fractions, decimals, and whole numbers.",
            "signed numbers": "Numbers that include a plus (+) or minus (−) sign to show direction or value.",
            "linear equations": "Math statements with an equal sign that graph as straight lines.",
            "polynomials": "Expressions made up of numbers, variables, and exponents added or subtracted.",
            "factoring": "Rewriting a number or expression as a product of its smaller parts or factors."
        };

        const formattedTopic = topic.toLowerCase();
        if (staticDefinitions[formattedTopic]) {
            definitionElement.innerText = staticDefinitions[formattedTopic];
        } else {
            definitionElement.innerText = "Definition not available.";
        }
    }

    /**
     * Fetches data for a given topic and updates the UI.
     * @param {string} topic - The topic to fetch data for.
     */
    async function fetchData(topic) {
        console.log("Fetching definition for:", topic);
        await fetchDefinition(topic);
        window.currentTopic = topic;
        const listItems = document.querySelectorAll('#topic-list li');
        listItems.forEach(item => item.classList.remove('selected'));
        const clickedItem = Array.from(listItems).find(li => li.textContent.trim().toLowerCase() === topic.toLowerCase());
        if (clickedItem) {
            clickedItem.classList.add('selected');
        }
    }

    /**
     * Plays the definition of the current topic using speech synthesis.
     */
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

    /**
     * Stops any ongoing speech synthesis and resets the progress indicators.
     */
    function stopAudio() {
        window.speechSynthesis.cancel();
        document.getElementById("audio-progress").value = 0;
        document.getElementById("audio-percentage").innerText = "0%";
    }

    /**
     * Clears the chat box by removing all its content.
     */
    function clearChat() {
        const chatBox = document.getElementById('chatBox');
        chatBox.innerHTML = '';
    }



    // Make these functions globally available for HTML onClick
    window.fetchData = fetchData;
    window.playDefinition = playDefinition;
    window.stopAudio = stopAudio;
    window.clearChat = clearChat;

});

/**
 * Plays a given assistant message using speech synthesis.
 * @param {string} assistantMessage - The message to be spoken by the assistant.
 */
function playAssistantMessage(assistantMessage) {
    currentUtterance = new SpeechSynthesisUtterance(assistantMessage);
    currentUtterance.voice = voices[6];
    currentUtterance.rate = 0.95;
    synth.speak(currentUtterance);
}



// Chat functionality and Markdown fixes
// Kept separate DOMContentLoaded for modularity

document.addEventListener("DOMContentLoaded", function () {
    // Grab references to chat-related elements
    const chatInput = document.getElementById("chatInput");
    const chatBox = document.getElementById("chatBox");
    // IMPORTANT: new ID for the Send button
    const sendButton = document.getElementById("sendButton");
    
    /**
     * Sanitizes user input to replace math delimiters for proper rendering.
     * @param {string} text - The user input text to sanitize.
     * @returns {string} - The sanitized text.
     */
    function sanitizeMathMessage(text) {
        return text.replace(/\\\[(.*?)\\]/gs, "\\($1\\)");
    }

    /**
     * Sends a message to the backend and processes the response.
     */
    window.sendMessage = function () {
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

        const sanitizedUserMessage = sanitizeMathMessage(userMessage);
        displayMessage(sanitizedUserMessage, "user");

        // Grab the selected topic or default to 'linear equations'
        const topic = window.currentTopic || "linear equations";
        const eventSource = new EventSource(`/chat?topic=${encodeURIComponent(topic)}&usermessage=${encodeURIComponent(userMessage)}`);

        let botMessageElement = document.createElement("div");
        botMessageElement.classList.add("message", "bot");
        chatBox.appendChild(botMessageElement);

        const messageElement = document.createElement("span");
        botMessageElement.appendChild(messageElement);

        let fullMessage = "";

        eventSource.onmessage = function (event) {
            try {
                const response = JSON.parse(event.data);
                const content = response.message?.content || "";
                fullMessage += content;
                messageElement.innerHTML = fullMessage;
                chatBox.scrollTop = chatBox.scrollHeight;

                // Rerender math if MathJax is loaded
                if (window.MathJax) {
                    window.MathJax.typesetPromise([messageElement]).catch((err) => console.log(err.message));
                }
                if (response.done) {
                    playAssistantMessage(sanitizeMathMessage(fullMessage));
                }
            } catch (error) {
                console.error("Error parsing response:", error);
                console.log("Raw data:", event.data);
            }
        };



        eventSource.onerror = function (event) {
            console.error("EventSource failed:", event);
            if (fullMessage.length === 0) {
                displayMessage("Error: Could not fetch response.", "bot");
            }
            eventSource.close();
        };

        chatInput.value = "";
    };

    // Send message when pressing Enter in the chat input
    chatInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }
    });

    // Attach click event listener to the Send button
    if (sendButton) {
        sendButton.addEventListener("click", function () {
            sendMessage();
        });
    }

    /**
     * Displays a message in the chat box.
     * @param {string} message - The message content to display.
     * @param {string} sender - The sender of the message ("user" or "bot").
     */
    function displayMessage(message, sender) {
        const messageElement = document.createElement("div");
        messageElement.classList.add("message", sender);
        messageElement.innerHTML = message;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;

        // Re-typeset if MathJax is loaded
        if (window.MathJax) {
            window.MathJax.typeset();
        }
    }
});
