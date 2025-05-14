async function fetchChatbotResponse(userInput) {
      
    const apiUrl = `http://127.0.0.1:8000/groq-tomato-analysis?query=${encodeURIComponent(userInput)}`;

    console.log("Sending request to API with input:", userInput);

    try {
        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        console.log("Received response from API:", response);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Parsed API response:", data);
        return data.response;
    } catch (error) {
        console.error("Error fetching chatbot response:", error);
        return "Sorry, there was an error processing your request. Please try again later.";
    }
}
