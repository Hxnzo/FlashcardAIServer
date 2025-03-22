import React, { useState, useEffect } from "react";

function Flashcard({ flashcard }) {
  const [flipped, setFlipped] = useState(false);

  // Hook to reset card to the question side if not on it when pressing arrows.
  useEffect(() => {
    setFlipped(false);
  }, [flashcard]);

  return (
    // Main container: clicking it toggles the 'flipped' state.
    <div
      onClick={() => setFlipped(!flipped)}
      className="w-[40rem] h-[24rem] max-w-[90vw] max-h-[90vh] bg-white text-gray-900 rounded-xl shadow-2xl 
                 cursor-pointer flex items-center justify-center 
                 transform transition-transform duration-500 hover:scale-105"
    >
      <div className="p-4 text-center">
        {/* Conditional rendering: if 'flipped' is true, display the answer; otherwise, display the question */}
        {flipped ? (
          <p className="text-xl font-medium">{flashcard.answer}</p>
        ) : (
          <p className="text-xl font-medium">{flashcard.question}</p>
        )}
      </div>
    </div>
  );
}

export default Flashcard;