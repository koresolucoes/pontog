import { GoogleGenAI, Type } from "@google/genai";
import { Coordinates } from "../types";

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

const locationSchema = {
    type: Type.OBJECT,
    properties: {
        lat: {
            type: Type.NUMBER,
            description: 'A latitude da localização.',
        },
        lng: {
            type: Type.NUMBER,
            description: 'A longitude da localização.',
        },
    },
    required: ["lat", "lng"],
};

/**
 * Converte o nome de uma localização em coordenadas geográficas usando Gemini.
 * @param locationName O nome do local (ex: "São Paulo, Brasil").
 * @returns Uma promessa que resolve para um objeto de Coordenadas ou nulo.
 */
export const geocodeLocation = async (locationName: string): Promise<Coordinates | null> => {
    try {
        const prompt = `Encontre as coordenadas geográficas (latitude e longitude) para a seguinte localização: "${locationName}". Responda apenas com o objeto JSON contendo as chaves "lat" e "lng".`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: locationSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);

        if (parsedJson && typeof parsedJson.lat === 'number' && typeof parsedJson.lng === 'number') {
            return {
                lat: parsedJson.lat,
                lng: parsedJson.lng,
            };
        }
        console.warn("Geocoding response was not in the expected format:", jsonText);
        return null;
    } catch (error) {
        console.error("Error geocoding location with Gemini:", error);
        return null;
    }
};
