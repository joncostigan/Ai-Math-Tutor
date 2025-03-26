// Wait until the entire HTML document has been loaded and parsed
// Updated to include clearChat globally

document.addEventListener("DOMContentLoaded", function () { // Runs the code only after the full page loads
    console.log("DOM fully loaded and ready"); // Confirms the document is ready in the browser console

    // Function to fetch and display static definitions
    async function fetchDefinition(topic) { // Declares an async function to get definition based on topic
        console.log("Fetching definition for:", topic); // Logs the topic to be fetched

        const definitionElement = document.getElementById("definition"); // Gets the paragraph element for showing the definition
        if (!definitionElement) { // Checks if the definition element exists
            console.error("❌ Error: Element with ID 'definition' not found."); // Logs error if not found
            return; // Stops the function
        }

        // Predefined dictionary of topics and their definitions
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

        const formattedTopic = topic.toLowerCase(); // Converts the topic to lowercase for consistent lookup

        if (staticDefinitions[formattedTopic]) { // If the topic is found in the dictionary
            definitionElement.innerText = staticDefinitions[formattedTopic]; // Show the matching definition
        } else {
            definitionElement.innerText = "Definition not available."; // Show fallback text if not found
        }
    }

    async function fetchData(topic) { // Handles clicking on a topic
        console.log("Fetching definition for:", topic); // Logs the topic

        await fetchDefinition(topic); // Calls the function to fetch its definition
        window.currentTopic = topic; // Saves the topic globally for use in chat

        const listItems = document.querySelectorAll('#topic-list li'); // Gets all list items (topics)
        listItems.forEach(item => item.classList.remove('selected')); // Removes highlight from all topics

        const clickedItem = Array.from(listItems).find(li => li.textContent.trim().toLowerCase() === topic.toLowerCase()); // Finds the clicked item
        if (clickedItem) {
            clickedItem.classList.add('selected'); // Highlights the selected item
        }
    }

    function playDefinition() { // Speaks the definition aloud
        const definitionText = document.getElementById("definition").innerText; // Gets the current definition

        if (!definitionText || definitionText === "Select a topic to see the definition.") { // Guard clause if empty
            alert("❌ No definition available to read."); // Alert user
            return; // Exit
        }

        stopAudio(); // Stop any currently playing audio

        let speechSynthesisUtterance = new SpeechSynthesisUtterance(definitionText); // Create a speech object
        let totalLength = definitionText.split(" ").length; // Count words in definition
        let wordsSpoken = 0; // Initialize spoken word counter

        let speakingInterval = setInterval(() => { // Set up simulated progress updates every 0.5s
            wordsSpoken++; // Increment
            let progress = Math.min((wordsSpoken / totalLength) * 100, 100); // Calculate percent done
            document.getElementById("audio-progress").value = progress; // Update progress bar
            document.getElementById("audio-percentage").innerText = Math.round(progress) + "%"; // Update percent label
        }, 500);

        speechSynthesisUtterance.onstart = () => { // When speech starts
            document.getElementById("audio-progress").value = 0; // Reset progress bar
            document.getElementById("audio-percentage").innerText = "0%"; // Reset label
        };

        speechSynthesisUtterance.onend = () => { // When speech ends
            clearInterval(speakingInterval); // Stop interval
            document.getElementById("audio-progress").value = 100; // Fill bar
            document.getElementById("audio-percentage").innerText = "100%"; // Final label
        };

        window.speechSynthesis.speak(speechSynthesisUtterance); // Start speaking
    }

    function stopAudio() { // Stops any speaking voice
        window.speechSynthesis.cancel(); // Stops audio
        document.getElementById("audio-progress").value = 0; // Reset progress
        document.getElementById("audio-percentage").innerText = "0%"; // Reset label
    }

    function clearChat() { // Clears chat messages
        const chatBox = document.getElementById('chatBox'); // Select chat box
        chatBox.innerHTML = ''; // Remove all inner content
    }

    // Make these functions available to HTML buttons using onclick=""
    window.fetchData = fetchData;
    window.playDefinition = playDefinition;
    window.stopAudio = stopAudio;
    window.clearChat = clearChat;
});