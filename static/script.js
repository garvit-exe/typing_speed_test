document.addEventListener("DOMContentLoaded", () => {
    const textToTypeElement = document.getElementById("text-to-type");
    const userInputElement = document.getElementById("user-input");
    const startRestartBtn = document.getElementById("start-restart-btn");
    const timerElement = document.getElementById("timer");
    const liveWpmElement = document.getElementById("live-wpm");
    const resultsElement = document.getElementById("results");
    const resultWpmElement = document.getElementById("result-wpm");
    const resultAccuracyElement = document.getElementById("result-accuracy");
    const resultCorrectWordsElement = document.getElementById(
        "result-correct-words"
    );
    const resultTypedWordsElement =
        document.getElementById("result-typed-words");
    const resultTimeElement = document.getElementById("result-time");

    let originalText = "";
    let startTime;
    let timerInterval;
    let testActive = false;
    let typedCharsCount = 0; // For live WPM calculation

    async function fetchNewText() {
        try {
            const response = await fetch("/get_text");
            const data = await response.json();
            originalText = data.text;
            renderTextToType(originalText, ""); // Initially no input
            userInputElement.value = "";
            userInputElement.disabled = true; // Disabled until "Start"
            resultsElement.classList.add("hidden");
            startRestartBtn.textContent = "Start Test";
            startRestartBtn.classList.remove("testing");
            timerElement.textContent = "Time: 0s";
            liveWpmElement.textContent = "WPM: 0";
            testActive = false;
            typedCharsCount = 0;
            if (timerInterval) clearInterval(timerInterval);
        } catch (error) {
            console.error("Error fetching text:", error);
            textToTypeElement.textContent =
                "Error loading text. Please try again.";
        }
    }

    function renderTextToType(text, typedValue) {
        textToTypeElement.innerHTML = ""; // Clear previous
        let currentOverallIndex = 0;

        for (let i = 0; i < text.length; i++) {
            const charSpan = document.createElement("span");
            charSpan.textContent = text[i];

            if (i < typedValue.length) {
                if (text[i] === typedValue[i]) {
                    charSpan.classList.add("correct");
                } else {
                    charSpan.classList.add("incorrect");
                }
            } else if (i === typedValue.length) {
                // Highlight the character user is expected to type next
                charSpan.classList.add("current");
            }
            textToTypeElement.appendChild(charSpan);
        }
    }

    function startTimer() {
        startTime = new Date().getTime();
        timerInterval = setInterval(() => {
            const elapsedTime = Math.floor(
                (new Date().getTime() - startTime) / 1000
            );
            timerElement.textContent = `Time: ${elapsedTime}s`;

            // Live WPM calculation
            const typedWords = typedCharsCount / 5; // Average word is 5 chars
            const minutes = elapsedTime / 60;
            const wpm = minutes > 0 ? Math.round(typedWords / minutes) : 0;
            liveWpmElement.textContent = `WPM: ${wpm}`;
        }, 1000);
    }

    function stopTest() {
        clearInterval(timerInterval);
        testActive = false;
        userInputElement.disabled = true;
        startRestartBtn.textContent = "Restart Test";
        startRestartBtn.classList.remove("testing");

        const timeTakenMs = new Date().getTime() - startTime;
        submitResults(originalText, userInputElement.value, timeTakenMs);
    }

    async function submitResults(original, typed, timeMs) {
        try {
            const response = await fetch("/submit_results", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    original_text: original,
                    typed_text: typed,
                    time_taken_ms: timeMs,
                }),
            });
            const results = await response.json();
            if (response.ok) {
                displayResults(results);
            } else {
                console.error("Error submitting results:", results.error);
                alert("Error submitting results: " + results.error);
            }
        } catch (error) {
            console.error("Network error submitting results:", error);
            alert("Network error. Could not submit results.");
        }
    }

    function displayResults(data) {
        resultWpmElement.textContent = data.wpm;
        resultAccuracyElement.textContent = `${data.accuracy}%`;
        resultCorrectWordsElement.textContent = data.correct_words;
        resultTypedWordsElement.textContent = data.typed_words;
        resultTimeElement.textContent = `${data.time_seconds}s`;
        resultsElement.classList.remove("hidden");
    }

    startRestartBtn.addEventListener("click", () => {
        if (!testActive) {
            // Start or Restart
            fetchNewText().then(() => {
                userInputElement.disabled = false;
                userInputElement.focus();
                startRestartBtn.textContent = "Stop Test";
                startRestartBtn.classList.add("testing");
                // Timer starts on first input, not on button click
                // to be more user-friendly.
            });
        } else {
            // Stop
            stopTest();
        }
    });

    userInputElement.addEventListener("input", () => {
        const typedValue = userInputElement.value;

        if (!testActive && typedValue.length > 0) {
            testActive = true;
            startTimer();
        }

        if (testActive) {
            typedCharsCount = typedValue.length; // Update for live WPM
            renderTextToType(originalText, typedValue); // Re-render with correct/incorrect highlighting

            // Check if test is complete (typed as much as the original text)
            // or if user presses Enter (and it's the last char or they intended to finish)
            // For simplicity, let's end if they type the full length.
            // A more robust way might be to check if the last typed char is the last of original.
            if (typedValue.length >= originalText.length) {
                // Automatically stop if they type the whole thing.
                // Ensure the last char is processed for display before stopping.
                userInputElement.value = typedValue.substring(
                    0,
                    originalText.length
                ); // Trim excess
                renderTextToType(originalText, userInputElement.value);
                stopTest();
            }
        }
    });

    // Initial load
    fetchNewText();
});
