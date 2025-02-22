// Wait until the entire HTML document has been loaded and parsed
document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ DOM fully loaded and ready!");

    // Variables to hold the SpeechSynthesisUtterance object and the interval for updating audio progress
    let speechSynthesisUtterance; // Will store the speech synthesis instance for reading out text
    let speakingInterval; // Holds the ID of the interval used for progress updates

    // ✅ Function to Fetch Definition from a Static List (simulating a Flask API response)
    async function fetchDefinition(topic) {
        console.log("Fetching definition for:", topic);
        
        // Get the HTML element where the definition will be displayed
        const definitionElement = document.getElementById("definition");
        if (!definitionElement) {
            console.error("❌ Error: Element with ID 'definition' not found.");
            return;
        }

        // Static definitions for various math topics
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

        // Format the topic string: convert to lowercase and replace spaces with underscores
        const formattedTopic = topic.toLowerCase().replace(/ /g, "_");
        // If the formatted topic exists in our static definitions, display its definition
        if (staticDefinitions[formattedTopic]) {
            definitionElement.innerText = staticDefinitions[formattedTopic];
        } else {
            // Otherwise, indicate that the definition is not available
            definitionElement.innerText = "Definition not available.";
        }
    }

    // ✅ Function to Fetch Example Problem from the Flask API
    async function fetchExample(topic) {
        console.log("Fetching example problem for:", topic);
        
        // Get the chat box element where the example problem will be appended
        const chatBox = document.getElementById("chatBox");
        if (!chatBox) {
            console.error("❌ Error: Element with ID 'chatBox' not found.");
            return;
        }

        try {
            // Format the topic string for use in the API endpoint URL
            const formattedTopic = topic.toLowerCase().replace(/ /g, "_");
            // Send an HTTP GET request to the API endpoint for generating an example problem
            const response = await fetch(`/generate_example?topic=${formattedTopic}`);
            
            // If the response is not successful, throw an error with its status code
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            // Parse the JSON response from the API
            const data = await response.json();
            console.log("Example Problem Response:", data);

            // Create a new div element to display the example problem in the chat box
            let message = document.createElement("div");
            message.classList.add("message", "received");
            // Check if the API returned an example; if so, use it, otherwise show a default message
            if (data.example) {
                message.textContent = data.example;
            } else {
                message.textContent = "Example not available.";
            }
            // Append the message to the chat box and scroll to the bottom
            chatBox.appendChild(message);
            chatBox.scrollTop = chatBox.scrollHeight;

        } catch (error) {
            // Log any errors that occur during fetching
            console.error("❌ Fetching Error:", error);
            // Display an error message in the chat box
            let message = document.createElement("div");
            message.classList.add("message", "received");
            message.textContent = "Error fetching example.";
            chatBox.appendChild(message);
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    }

    // ✅ Function to Fetch Both Definition and Example for a Given Topic
    async function fetchData(topic) {
        console.log("Fetching definition and example for:", topic);
        
        // Call the function to fetch the definition first
        await fetchDefinition(topic);
        // Then call the function to fetch an example problem
        await fetchExample(topic);
    }

    // ✅ Function to Play Definition Audio with Progress Tracking
    function playDefinition() {
        // Get the definition text from the DOM element
        const definitionText = document.getElementById("definition").innerText;
        // Check if a valid definition exists before attempting to speak
        if (!definitionText || definitionText === "Select a topic to see the definition.") {
            alert("❌ No definition available to read.");
            return;
        }

        // Stop any existing audio playback before starting a new one
        stopAudio();

        // Create a new SpeechSynthesisUtterance instance with the definition text
        speechSynthesisUtterance = new SpeechSynthesisUtterance(definitionText);
        
        // Estimate the total number of words in the definition for progress calculation
        const totalLength = definitionText.split(" ").length;
        let wordsSpoken = 0; // Initialize a counter for the number of words spoken
        
        // Function to update the progress bar periodically
        function updateProgress() {
            wordsSpoken++;
            // Calculate progress as a percentage based on words spoken
            let progress = Math.min((wordsSpoken / totalLength) * 100, 100);
            // Update the progress bar value and display the percentage in the DOM
            document.getElementById("audio-progress").value = progress;
            document.getElementById("audio-percentage").innerText = Math.round(progress) + "%";
        }

        // Start an interval timer that updates the progress every 0.5 seconds (500 milliseconds)
        speakingInterval = setInterval(updateProgress, 500);

        // Reset progress bar when speech starts
        speechSynthesisUtterance.onstart = function () {
            document.getElementById("audio-progress").value = 0;
            document.getElementById("audio-percentage").innerText = "0%";
        };

        // When speech synthesis ends, clear the interval and set progress to 100%
        speechSynthesisUtterance.onend = function () {
            clearInterval(speakingInterval);
            document.getElementById("audio-progress").value = 100;
            document.getElementById("audio-percentage").innerText = "100%";
        };

        // Start speaking the definition using the browser's speech synthesis API
        window.speechSynthesis.speak(speechSynthesisUtterance);
    }

    // ✅ Function to Stop the Audio Playback and Reset the Progress Bar
    function stopAudio() {
        if (speechSynthesisUtterance) {
            // Cancel any ongoing speech synthesis
            window.speechSynthesis.cancel();
            // Clear the interval used for updating the progress bar
            clearInterval(speakingInterval);
            // Reset the progress bar and percentage display to 0%
            document.getElementById("audio-progress").value = 0;
            document.getElementById("audio-percentage").innerText = "0%";
        }
    }

    // Expose key functions to the global window object so they can be accessed from the HTML (e.g., via button clicks)
    window.fetchData = fetchData;
    window.playDefinition = playDefinition;
    window.stopAudio = stopAudio;
});

// Function to handle sending chat messages
function sendMessage() {
    // Get the input field, chat box, and typing indicator elements from the DOM
    let input = document.getElementById("chatInput");
    let chatBox = document.getElementById("chatBox");
    let typingIndicator = document.getElementById("typing");

    // Check if the user has entered any non-whitespace text
    if (input.value.trim() !== "") {
        // Create a new div element for the user's sent message
        let message = document.createElement("div");
        message.classList.add("message", "sent"); // Apply classes for styling sent messages
        message.textContent = input.value; // Set the text of the message from the input field
        // Append the sent message to the chat box
        chatBox.appendChild(message);
        // Clear the input field after sending the message
        input.value = "";
        // Scroll the chat box to the bottom to show the latest message
        chatBox.scrollTop = chatBox.scrollHeight;
        
        // Display the typing indicator to simulate a response delay
        typingIndicator.style.display = "block";
        // After a 1-second delay, hide the typing indicator and append a reply message
        setTimeout(() => {
            typingIndicator.style.display = "none";
            // Create a new div element for the received reply message
            let reply = document.createElement("div");
            reply.classList.add("message", "received"); // Apply classes for styling received messages
            reply.textContent = "Got it!"; // Set the reply text
            // Append the reply to the chat box
            chatBox.appendChild(reply);
            // Scroll to the bottom of the chat box to show the new reply
            chatBox.scrollTop = chatBox.scrollHeight;
        }, 1000);
    }
}

// Make the fetchData function globally accessible outside the DOMContentLoaded event as well
window.fetchData = fetchData;
