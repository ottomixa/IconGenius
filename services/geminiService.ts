import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { PromptEnhancementResponse } from "../types";

// Helper to get a fresh client instance.
// CRITICAL: Must be called right before API calls to ensure valid key.
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Helper to extract base64 data from response
const extractBase64Image = (response: GenerateContentResponse): string => {
  if (response.candidates && response.candidates[0].content.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return part.inlineData.data;
      }
    }
  }
  throw new Error("No image data found in generation response.");
};

/**
 * Step 1: Use a lightweight text model to "think" about the icon request.
 */
export const enhancePrompt = async (userPrompt: string): Promise<PromptEnhancementResponse> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The user wants an icon generated. 
      User request: "${userPrompt}".
      
      Your task:
      1. Act as an expert AI art director. Refine this request into a highly detailed, comma-separated image generation prompt suitable for an app icon or system icon. Focus on keywords like "vector", "minimalist", "3d render", "gradient", "centered", "white background" (or transparent if implied), "high fidelity".
      2. Decide the best size. If the user asks for "high quality", "4k", "detailed", or "large", choose "2K". Otherwise, default to "1K".
      3. Provide a short description of the style you chose.

      Return ONLY JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            refinedPrompt: {
              type: Type.STRING,
              description: "The detailed prompt for the image generator",
            },
            suggestedSize: {
              type: Type.STRING,
              enum: ["1K", "2K"],
              description: "The suggested resolution size",
            },
            styleDescription: {
              type: Type.STRING,
              description: "A short label for the style (e.g. '3D Neumorphism')",
            }
          },
          required: ["refinedPrompt", "suggestedSize", "styleDescription"],
        },
      },
    });

    if (!response.text) {
      throw new Error("No response text from prompt enhancement.");
    }

    return JSON.parse(response.text) as PromptEnhancementResponse;
  } catch (error) {
    console.error("Error enhancing prompt:", error);
    // Fallback if the smart enhancement fails
    return {
      refinedPrompt: `A high quality app icon, ${userPrompt}, vector style, white background`,
      suggestedSize: '1K',
      styleDescription: 'Standard'
    };
  }
};

/**
 * Step 2: Use the high-quality image model to generate the icon.
 * Includes fallback to Flash model if Pro model fails (e.g. permission/quota).
 */
export const generateIconImage = async (
  prompt: string,
  size: '1K' | '2K'
): Promise<string> => {
  const ai = getAiClient();
  
  // Primary Attempt: High Quality (Pro)
  try {
    console.log("Attempting generation with gemini-3-pro-image-preview...");
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview', // High quality model for icons
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1", // Icons are square
          imageSize: size,
        },
      },
    });

    return extractBase64Image(response);

  } catch (error: any) {
    console.warn("Primary model failed (likely permission/billing). Attempting fallback to gemini-2.5-flash-image.", error);
    
    // Fallback Attempt: Fast (Flash)
    // Note: Flash image does not support 'imageSize' param, so we omit it.
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
          },
        },
      });
      return extractBase64Image(response);
    } catch (fallbackError) {
      console.error("Fallback model also failed.", fallbackError);
      // If both fail, throw the original error as it is likely more descriptive of the root cause (e.g. bad API key)
      throw error;
    }
  }
};
