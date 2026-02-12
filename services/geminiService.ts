import { GoogleGenAI, Type, Schema } from "@google/genai";
import { FoodRecommendation } from "../types";

// Initialize Gemini Client
// Note: process.env.API_KEY is injected by the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const foodSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Name of the dish in Chinese" },
    originalName: { type: Type.STRING, description: "Name of the dish in its original language" },
    countryOfOrigin: { type: Type.STRING, description: "Country where the dish originated (in Chinese)" },
    region: { type: Type.STRING, description: "Specific region or city of origin if applicable (in Chinese)" },
    popularIn: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List of countries where this dish is popular (in Chinese)"
    },
    description: { type: Type.STRING, description: "A one sentence appetizing description (in Chinese)" },
    history: { type: Type.STRING, description: "Detailed history and cultural significance of the dish (approx 100 words in Chinese)" },
    flavorProfile: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Keywords describing the taste (e.g., Spicy, Sweet, Savory) in Chinese"
    },
    prepTime: { type: Type.STRING, description: "Estimated preparation and cooking time" },
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          item: { type: Type.STRING },
          amount: { type: Type.STRING }
        }
      }
    },
    cookingSteps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          stepNumber: { type: Type.INTEGER },
          instruction: { type: Type.STRING }
        }
      }
    },
    encyclopediaUrl: { 
      type: Type.STRING, 
      description: "A valid URL to a Baidu Baike or Wikipedia entry for this dish. If unsure, leave empty." 
    }
  },
  required: ["name", "countryOfOrigin", "history", "ingredients", "cookingSteps", "description"],
};

// List of diverse cuisines/regions to force variety
const cuisines = [
  "Chinese (Sichuan)", "Chinese (Cantonese)", "Chinese (Northern)", "Chinese (Jiangnan)",
  "Italian", "Japanese", "Mexican", "French", "Indian", "Thai", 
  "Spanish", "Greek", "American", "Korean", "Vietnamese", 
  "Turkish", "Lebanese", "Brazilian", "Peruvian", "German", 
  "British", "Ethiopian", "Moroccan", "Indonesian", "Russian",
  "Malaysian", "Portuguese", "Argentinian", "Egyptian", "Iranian"
];

export const fetchFoodRecommendation = async (): Promise<FoodRecommendation> => {
  try {
    const model = "gemini-3-flash-preview";
    
    // Pick a random cuisine to ensure variety
    const randomCuisine = cuisines[Math.floor(Math.random() * cuisines.length)];
    
    // Add a random seed concept to the prompt to further discourage caching/repetition
    const randomSeed = Math.floor(Math.random() * 10000);

    // Updated prompt to focus on popular/common dishes but FORCED within a random category
    const prompt = `
      Task: Recommend a popular, well-known, and delicious dish specifically from **${randomCuisine}** cuisine.
      
      Constraint: 
      - The dish must be a "common" dish that is representative of that region.
      - Do NOT simply output the first dish that comes to mind (like Mapo Tofu for Chinese or Sushi for Japanese) unless it truly is the best fit, but try to vary it.
      - Random Seed: ${randomSeed} (Use this to vary your choice).
      
      Output: Provide the output in valid JSON format matching the schema.
      Language: Ensure all text content is in Chinese (Simplified).
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: foodSchema,
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for faster JSON generation
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No data received from Gemini.");
    }

    return JSON.parse(text) as FoodRecommendation;
  } catch (error) {
    console.error("Error fetching food recommendation:", error);
    throw error;
  }
};

export const generateFoodImage = async (dishName: string, description: string): Promise<string> => {
  try {
    // Revert to gemini-2.5-flash-image to avoid 403 Permission Denied errors on Pro models
    const model = "gemini-2.5-flash-image";
    
    const prompt = `Generate a photorealistic, high-resolution, professional food photography image of ${dishName}. 
    Description: ${description}. 
    The lighting should be warm and appetizing. Macro shot, shallow depth of field.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      // gemini-2.5-flash-image does not support imageConfig, so we remove it.
    });

    // Extract image from response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    // If no image is returned, log a warning but don't crash. Return a relevant placeholder.
    console.warn("No inlineData found in Gemini response. Using fallback image.");
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(dishName + " food photography")}`;
  } catch (error) {
    console.error("Error generating food image:", error);
    // Return a fallback placeholder if generation fails so the UI still works
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(dishName + " food photography")}`; 
  }
};