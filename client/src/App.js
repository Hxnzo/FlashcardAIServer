import React, { useState } from 'react';
import Flashcard from './Flashcard';

function App() {
  // States used for UI changes.
  const [currentScreen, setCurrentScreen] = useState("prompt");
  const [promptText, setPromptText] = useState("");
  const [numCards, setNumCards] = useState(5);
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Function that sends a POST request to generate flashcards based on the provided text from user.
  const handleGenerateFlashcards = async () => {
    // Validate that the prompt text is not empty.
    if (promptText.trim() === "") {
      alert("Please enter some text in the prompt.");
      return;
    }

    try {
      // Send the prompt text and the desired number of flashcards to the backend API.
      const response = await fetch('http://localhost:5000/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: promptText, numCards })
      });

      const data = await response.json();

      // If flashcards are returned, update the state and navigate to the flashcards screen.
      if (data.flashcards && data.flashcards.length > 0) {
        setFlashcards(data.flashcards);
        setCurrentIndex(0);
        setCurrentScreen("flashcards");
      } 
      else {
        alert("Failed to generate flashcards.");
      }
    } catch (error) {
      console.error("Error generating flashcards:", error);

      alert("An error occurred while generating flashcards.");
    }
  };

  // Function allows user to return to the prompt screen for editing the text.
  const handleEditPrompt = () => {
    setCurrentScreen("prompt");
  };

  // Navigation functions for moving to previous or next flashcard in the carousel.
  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header with the app title */}
      <div className="absolute top-4 left-4 mx-10 my-5">
        <h1 className="text-3xl font-extrabold text-blue-500 animate-pulse">
          FlashcardAI
        </h1>
      </div>

      {/* PROMPT SCREEN */}
      {currentScreen === "prompt" && (
        <div className="flex flex-col items-center justify-center flex-1">
          <div className="w-3/4 min-h-[75vh] bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col">
            {/* Textarea for users to paste lecture/presentation text */}
            <textarea
              className="flex-1 w-full p-3 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              placeholder="Paste your lecture or presentation text here..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
            />
            
            {/* Input for specifying the number of flashcards to generate */}
            <div className="mt-4 flex items-center space-x-2">
              <label>Number of Flashcards:</label>
              <input 
                type="number" 
                min="1" 
                value={numCards} 
                onChange={(e) => setNumCards(Number(e.target.value))} 
                className="w-12 p-1 rounded text-gray-900"
              />
            </div>

            {/* Button to trigger flashcard generation */}
            <button 
              onClick={handleGenerateFlashcards} 
              className="mt-2 w-40 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-semibold text-sm self-center"
            >
              Generate Flashcards
            </button>
          </div>
        </div>
      )}

      {/* FLASHCARDS SCREEN */}
      {currentScreen === "flashcards" && (
        <div className="flex-1 relative flex flex-col overflow-x-hidden">
          {/* Carousel Container */}
          <div className="relative w-full flex-1 flex items-center justify-center">
            {flashcards.length > 0 && (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Render the previous flashcard as a scaled, semi-transparent preview if available */}
                {currentIndex > 0 && (
                  <div className="absolute left-10 top-1/2 transform -translate-y-1/2 scale-90 opacity-50 pointer-events-none">
                    <Flashcard flashcard={flashcards[currentIndex - 1]} />
                  </div>
                )}

                {/* Render the current active flashcard */}
                <div className="z-10">
                  <Flashcard flashcard={flashcards[currentIndex]} />
                </div>

                {/* Render the next flashcard as a scaled, semi-transparent preview if available */}
                {currentIndex < flashcards.length - 1 && (
                  <div className="absolute right-10 top-1/2 transform -translate-y-1/2 scale-90 opacity-50 pointer-events-none">
                    <Flashcard flashcard={flashcards[currentIndex + 1]} />
                  </div>
                )}
              </div>
            )}

            {/* Left navigation arrow to go to the previous flashcard */}
            {currentIndex > 0 && (
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                <button onClick={goPrev} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>
            )}

            {/* Right navigation arrow to go to the next flashcard */}
            {currentIndex < flashcards.length - 1 && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <button onClick={goNext} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Bottom Controls - Button to return to the prompt screen for editing */}
          <div className="flex items-center justify-center p-4">
            <button onClick={handleEditPrompt} className="px-4 py-2 mb-10 bg-red-600 hover:bg-red-700 rounded-md font-semibold">
              Edit Prompt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;