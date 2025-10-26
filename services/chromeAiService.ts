import type { AnalysisResult } from '../types';

// Extend the Window interface to include the `ai` property
declare global {
  interface Window {
    ai?: {
      prompt: (prompt: string) => Promise<string>;
      canCreateTextSession: () => Promise<string>;
    };
  }
}

/**
 * MOCK AI SERVICE
 * This function simulates the AI response for development environments
 * where the built-in Chrome AI is not available.
 */
const getMockAIResponse = (): Promise<AnalysisResult> => {
  console.warn(
    "Built-in AI not found. Returning a mock response for development."
  );
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        description: "A cute, fluffy Corgi puppy is sitting on a vibrant green grass field.",
        keywords: ["corgi", "puppy", "grass", "dog", "cute"],
        phonetics: {
          corgi: "kor-gee",
          puppy: "puh-pee",
          grass: "gras",
          dog: "dog",
          cute: "kyoot"
        }
      });
    }, 1200); // Simulate a short delay
  });
};


const prompt = `
You are a language learning assistant. Your task is to analyze an image and provide educational content for an English language learner.

Analyze the image and respond strictly with a JSON object that has three keys:
1. "description": A short, simple, descriptive sentence about the main subject of the image.
2. "keywords": An array of 3-5 strings, where each string is a key noun or object visible in the image. The words should be in lowercase.
3. "phonetics": A JSON object where keys are the words from the "keywords" array and values are their simple, easy-to-read phonetic spellings (e.g., "hello" -> "heh-loh").

Example response:
{
  "description": "A fluffy white cat is sleeping on a blue sofa.",
  "keywords": ["cat", "sofa", "sleeping", "white", "fluffy"],
  "phonetics": {
    "cat": "kat",
    "sofa": "so-fa",
    "sleeping": "sleep-ing",
    "white": "wite",
    "fluffy": "fluh-fee"
  }
}

Do not include any text or formatting outside of the JSON object.
`;

export const analyzeImage = async (base64ImageData: string): Promise<AnalysisResult> => {
  if (!window.ai || (await window.ai.canCreateTextSession()) === 'no') {
    // Instead of throwing an error, we'll use the mock service for development.
    return getMockAIResponse();
  }
  
  try {
    const fullPrompt = `${prompt}\n\nIMAGE_BASE64:${base64ImageData}`;
    const responseText = await window.ai.prompt(fullPrompt);
    
    // Clean the response to ensure it's valid JSON
    // The model sometimes wraps the JSON in ```json ... ```
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = responseText.match(jsonRegex);
    const cleanText = match ? match[1] : responseText;

    const result = JSON.parse(cleanText) as AnalysisResult;

    // Basic validation
    if (!result.description || !Array.isArray(result.keywords)) {
      throw new Error('AI returned an invalid response format.');
    }

    return result;

  } catch (error) {
    console.error("Error analyzing image with Chrome AI:", error);
    // Provide a more user-friendly error message
    if (error instanceof SyntaxError) {
        throw new Error("The AI returned a response that we couldn't understand. Please try again.");
    }
    throw error;
  }
};