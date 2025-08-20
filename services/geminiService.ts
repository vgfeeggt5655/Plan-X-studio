import { GoogleGenAI, Type } from "@google/genai";
import { MCQ, Flashcard } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


export const generateMCQs = async (pdfText: string): Promise<MCQ[]> => {
  try {
    // Truncate text to avoid exceeding token limits, focusing on the beginning which often has objectives.
    const truncatedText = pdfText.length > 20000 ? pdfText.substring(0, 20000) : pdfText;
    const prompt = `Based on the following text from a medical lecture PDF: "${truncatedText}". Make a quiz of 20 MCQ questions. Each question must have 4 options and one correct answer. Focus on the key points, especially anything that looks like it's from an "objectives" or "summary" slide.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctAnswer: { type: Type.STRING }
            },
            required: ["question", "options", "correctAnswer"]
          }
        }
      }
    });

    const jsonText = response.text.trim();
    const mcqs = JSON.parse(jsonText);

    if (!Array.isArray(mcqs)) {
      throw new Error("API did not return a valid array of MCQs.");
    }

    // Additional validation
    return mcqs.filter(mcq => 
        mcq.question && 
        Array.isArray(mcq.options) && 
        mcq.options.length > 0 && 
        mcq.correctAnswer &&
        mcq.options.includes(mcq.correctAnswer)
    );

  } catch (error) {
    console.error("Error generating MCQs with Gemini API:", error);
    throw new Error("Failed to generate the quiz. The AI might be busy, or an API error occurred.");
  }
};

export const generateFlashcards = async (pdfText: string): Promise<Flashcard[]> => {
  try {
    const truncatedText = pdfText.length > 20000 ? pdfText.substring(0, 20000) : pdfText;
    const prompt = `Based on the following text from a medical lecture PDF, create a set of flashcards. Each flashcard should have a "front" (a question or a term) and a "back" (the answer or definition). Focus on key concepts, definitions, and important facts. Create around 15-20 flashcards. Text: "${truncatedText}"`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              front: { type: Type.STRING, description: "The question or term on the front of the card." },
              back: { type: Type.STRING, description: "The answer or definition on the back of the card." }
            },
            required: ["front", "back"]
          }
        }
      }
    });

    const jsonText = response.text.trim();
    const flashcards = JSON.parse(jsonText);

    if (!Array.isArray(flashcards)) {
      throw new Error("API did not return a valid array of flashcards.");
    }
    
    // Basic validation
    return flashcards.filter(fc => fc.front && fc.back);

  } catch (error) {
    console.error("Error generating flashcards with Gemini API:", error);
    throw new Error("Failed to generate flashcards. The AI might be busy, or an API error occurred.");
  }
};