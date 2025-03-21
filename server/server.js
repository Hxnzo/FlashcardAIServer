require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const OpenAI = require("openai");

// Create an instance of the Express application and define the port number.
const app = express();
const port = 5000;

// Apply middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize the OpenAI client using the API key from the environment variables.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Async function that generates flashcards using the OpenAI GPT model that takes a block of text and a count (number of flashcards wanted) as inputs.
const generateFlashcards = async (text, count) => {
    try {
      // Sends a prompt instructing the model to generate the flashcards.
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: `You are a helpful AI that generates educational flashcards. You MUST generate EXACTLY ${count} flashcards. Each flashcard must be clearly separated by "####". The output format must be:
            
            Question: <question text>
            Answer: <answer text>
            ####
            Question: <question text>
            Answer: <answer text>
            ####
            etc.
            
            You must ensure you generate exactly ${count} flashcards, no more and no less.`
          },
          {
            role: "user",
            content: `Generate exactly ${count} flashcards based on the following text. Make sure each flashcard has a clear question and answer.
            
            Text: ${text}`
          }
        ],
        max_tokens: 2000,
      });
  
      // Log the raw response from OpenAI (for debugging).
      console.log("OpenAI Response:", JSON.stringify(response.choices, null, 2));
      const content = response.choices[0].message.content;
      
      // Parse the output into individual flashcards
      let rawFlashcards;

      if (content.includes("####")) {
        rawFlashcards = content.split(/####\s*/).map(card => card.trim()).filter(Boolean);
      } 
      else {
        const flashcardRegex = /Question:\s*([\s\S]+?)\s*Answer:\s*([\s\S]+?)(?=Question:|$)/gi;

        rawFlashcards = [];
        let match;

        while ((match = flashcardRegex.exec(content)) !== null) {
          rawFlashcards.push(`Question: ${match[1].trim()}\nAnswer: ${match[2].trim()}`);
        }
      }
  
      // Log Raw flashcards count for debugging.
      console.log("Raw flashcards count:", rawFlashcards.length);
      
      // Map over the raw flashcards and extract 'question' and 'answer' objects.
      const flashcards = rawFlashcards.map(card => {
        const questionMatch = card.match(/Question:\s*([\s\S]+?)(?=Answer:|$)/i);
        const answerMatch = card.match(/Answer:\s*([\s\S]+)/i);
        
        if (questionMatch && answerMatch) {
          return {
            question: questionMatch[1].trim(),
            answer: answerMatch[1].trim()
          };
        }

        return null;
      }).filter(card => card !== null);
  
      // Log Parsed flashcards count for debugging.
      console.log("Parsed flashcards count:", flashcards.length);
      
      // If the first attempt didn't yield enough flashcards, make a second API call to ensure the number of flashcards are as needed. 
      if (flashcards.length < count) {
        console.log(`First attempt didn't return enough flashcards (got ${flashcards.length}, need ${count}). Making another request...`);
        
        const secondResponse = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          temperature: 0.3,
          messages: [
            {
              role: "system",
              content: `You MUST generate EXACTLY ${count} flashcards. No more, no less. Each flashcard must have Question: and Answer: clearly marked. Each flashcard must be separated by "####" on its own line.`
            },
            {
              role: "user",
              content: `Generate EXACTLY ${count} flashcards based on this text. I need EXACTLY ${count} flashcards separated by "####".
              
              Text: ${text}`
            }
          ],
          max_tokens: 2000,
        });
        
        const secondContent = secondResponse.choices[0].message.content;
        const secondRawFlashcards = secondContent.split(/####\s*/).map(card => card.trim()).filter(Boolean);
        
        const secondParsedFlashcards = secondRawFlashcards.map(card => {
          const questionMatch = card.match(/Question:\s*([\s\S]+?)(?=Answer:|$)/i);
          const answerMatch = card.match(/Answer:\s*([\s\S]+)/i);
          
          if (questionMatch && answerMatch) {
            return {
              question: questionMatch[1].trim(),
              answer: answerMatch[1].trim()
            };
          }

          return null;
        }).filter(card => card !== null);
        
        // Append the new flashcards from the second attempt.
        if (secondParsedFlashcards.length > 0) {
          flashcards.push(...secondParsedFlashcards);
        }
      }
      
      // Final adjustments: if too many flashcards are generated, trim the extras; if too few, add placeholder cards.
      let finalFlashcards = flashcards;
      if (flashcards.length > count) {
        finalFlashcards = flashcards.slice(0, count);

        console.log(`Trimmed excess flashcards (had ${flashcards.length}, needed ${count})`);
      } 
      else if (flashcards.length < count) {
        console.log(`After multiple attempts, still short on flashcards (got ${flashcards.length}, need ${count}). Adding placeholders.`);

        const missing = count - flashcards.length;

        for (let i = 0; i < missing; i++) {
          finalFlashcards.push({
            question: `Flashcard ${flashcards.length + i + 1} (Please regenerate for better content)`,
            answer: `This is a placeholder card. Please regenerate flashcards for better content.`
          });
        }
      }
      
      console.log(`Final flashcards count: ${finalFlashcards.length}`);

      // Return the final array of flashcards.
      return finalFlashcards;
    } catch (error) {
      // Log any errors encountered during flashcard generation and return an empty array.
      console.error("Error generating flashcards:", error.response ? error.response.data : error);

      return [];
    }
  };


// api endpoint to generate flashcards
app.post('/generate-flashcards', async (req, res) => {
  // Extract the text to base the flashcards on and the number of flashcards desired from the request body.
  const { text, numCards } = req.body;
  console.log("Received numCards:", numCards);

  // Validate the input
  if (!text || numCards <= 0) {
    return res.status(400).json({ error: "Invalid input." });
  }

  // Call the flashcard generation function and send back the resulting flashcards in the response. 
  const flashcards = await generateFlashcards(text, numCards);
  res.json({ flashcards });
});

// Start the server on the specified port
app.listen(port, () => console.log(`Server running on http://localhost:${port}`)); 