document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded and ready");

    async function fetchDefinition(topic) {
        const definitionElement = document.getElementById("definition");
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
        definitionElement.innerText = staticDefinitions[formattedTopic] || "Definition not available.";
    }

    async function fetchData(topic) {
        await fetchDefinition(topic);
        window.currentTopic = topic;
        const listItems = document.querySelectorAll('#topic-list li');
        listItems.forEach(item => item.classList.remove('selected'));
        const clickedItem = Array.from(listItems).find(li => li.textContent.trim().toLowerCase() === topic.toLowerCase());
        if (clickedItem) clickedItem.classList.add('selected');
    }

    function playDefinition() {
        const definitionText = document.getElementById("definition").innerText;
        if (!definitionText || definitionText === "Select a topic to see the definition.") {
            alert("❌ No definition available to read.");
            return;
        }
        stopAudio();
        const utterance = new SpeechSynthesisUtterance(definitionText);
        const words = definitionText.split(" ").length;
        let spoken = 0;
        const interval = setInterval(() => {
            spoken++;
            const progress = Math.min((spoken / words) * 100, 100);
            document.getElementById("audio-progress").value = progress;
            document.getElementById("audio-percentage").innerText = Math.round(progress) + "%";
        }, 500);
        utterance.onstart = () => {
            document.getElementById("audio-progress").value = 0;
            document.getElementById("audio-percentage").innerText = "0%";
        };
        utterance.onend = () => {
            clearInterval(interval);
            document.getElementById("audio-progress").value = 100;
            document.getElementById("audio-percentage").innerText = "100%";
        };
        window.speechSynthesis.speak(utterance);
    }

    function stopAudio() {
        window.speechSynthesis.cancel();
        document.getElementById("audio-progress").value = 0;
        document.getElementById("audio-percentage").innerText = "0%";
    }

    function clearChat() {
        document.getElementById('chatBox').innerHTML = '';
    }

    window.fetchData = fetchData;
    window.playDefinition = playDefinition;
    window.stopAudio = stopAudio;
    window.clearChat = clearChat;
});

document.addEventListener("DOMContentLoaded", function () {
    const chatInput = document.getElementById("chatInput");
    const chatBox = document.getElementById("chatBox");
    const sendButton = document.getElementById("sendButton");

    function sanitizeMathMessage(text) {
        return text.replace(/\\\[(.*?)\\\]/g, "\\($1\\)");
    }

    window.sendMessage = function () {
        sendButton.disabled = true;
        sendButton.classList.add("disabled"); // ✅ visually gray

        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

        const sanitizedUserMessage = sanitizeMathMessage(userMessage);
        displayMessage(sanitizedUserMessage, "user");

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
                if (window.MathJax) window.MathJax.typesetPromise([messageElement]);
            } catch (error) {
                console.error("Error parsing response:", error);
            }
        };

        eventSource.onerror = function (event) {
            console.error("EventSource failed:", event);
            eventSource.close();
            if (fullMessage.length === 0) {
                displayMessage("Error: Could not fetch response.", "bot");
            }
            sendButton.disabled = false;
            sendButton.classList.remove("disabled"); // ♻️ enable visual state
        };

        eventSource.onopen = function () {
            console.log("Connection opened.");
        };

        eventSource.onclose = function () {
            console.log("Stream closed.");
            sendButton.disabled = false;
            sendButton.classList.remove("disabled"); // ♻️ enable visual state
        };

        chatInput.value = "";
    };

    chatInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }
    });

    if (sendButton) {
        sendButton.addEventListener("click", sendMessage);
    }

    function displayMessage(message, sender) {
        const msg = document.createElement("div");
        msg.classList.add("message", sender);
        msg.innerHTML = message;
        chatBox.appendChild(msg);
        chatBox.scrollTop = chatBox.scrollHeight;
        if (window.MathJax) window.MathJax.typeset();
    }
});
