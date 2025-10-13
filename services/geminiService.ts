import { GoogleGenAI } from "@google/genai";

// Fix: Initialize the Gemini AI client as per the guidelines.
// The API key is sourced directly from environment variables, assuming it's pre-configured.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * Generates a creative icebreaker message to start a conversation.
 * @param userName The name of the user to start a conversation with.
 * @returns A promise that resolves to the generated message string.
 */
export const generateIcebreaker = async (userName: string): Promise<string> => {
  try {
    const prompt = `Crie uma mensagem curta, amigável e criativa para iniciar uma conversa com ${userName} em um aplicativo de conhecer pessoas. Seja casual e divertido. Retorne apenas o texto da mensagem.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error generating icebreaker with Gemini:", error);
    // Provide a fallback message in case of an API error
    return "Oi! Tudo bem?";
  }
};
