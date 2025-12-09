
import { GoogleGenAI, Type } from "@google/genai";
import { Park, Task } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// System instruction for the gardening assistant
const ASSISTANT_SYSTEM_INSTRUCTION = `
You are "Rooty", a helpful, knowledgeable, and enthusiastic gardening assistant for a community park app. 
You help volunteers organize tasks, identify plants, and provide gardening advice.
Keep answers concise, encouraging, and practical.
`;

export const getGardeningAdvice = async (userQuery: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userQuery,
      config: {
        systemInstruction: ASSISTANT_SYSTEM_INSTRUCTION,
      }
    });
    return response.text || "I'm sorry, I couldn't generate advice right now.";
  } catch (error) {
    console.error("Error fetching advice:", error);
    return "Sorry, I'm having trouble connecting to the gardening database right now.";
  }
};

export const suggestTasksFromDescription = async (observation: string): Promise<Partial<Task>[]> => {
  try {
    const prompt = `
      Based on the following observation of a park area, suggest a list of concrete, actionable gardening or maintenance tasks.
      Observation: "${observation}"
      
      Return a JSON array of tasks.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Short title of the task" },
              description: { type: Type.STRING, description: "Detailed description of what needs to be done" },
              urgency: { type: Type.STRING, enum: ["Low", "Medium", "High"] }
            },
            required: ["title", "description", "urgency"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as Partial<Task>[];
  } catch (error) {
    console.error("Error suggesting tasks:", error);
    return [];
  }
};

export const findLocalParks = async (query: string, userLocation?: {lat: number, lng: number}): Promise<Park[]> => {
  try {
    const prompt = `
      Find parks near ${query}. 
      List them with their names, full address, coordinates (latitude/longitude), and a brief 1-sentence description.
      
      Format the output as a list of items separated by "---".
      Each item should strictly follow this format:
      Name: [Park Name]
      Address: [Park Address]
      Description: [Description]
      Lat: [Latitude]
      Lng: [Longitude]
    `;

    const config: any = {
      tools: [{ googleMaps: {} }],
    };

    if (userLocation) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: userLocation.lat,
            longitude: userLocation.lng
          }
        }
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: config
    });

    const text = response.text;
    if (!text) return [];

    // Extract Google Maps links from grounding metadata
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    // Parse the text response
    const parkStrings = text.split('---').map(s => s.trim()).filter(s => s);
    const parks: Park[] = parkStrings.map((s, index) => {
      const nameMatch = s.match(/Name:\s*(.+)/);
      const addressMatch = s.match(/Address:\s*(.+)/);
      const descMatch = s.match(/Description:\s*(.+)/);
      const latMatch = s.match(/Lat:\s*([0-9.-]+)/);
      const lngMatch = s.match(/Lng:\s*([0-9.-]+)/);

      const name = nameMatch ? nameMatch[1].trim() : `Park ${index + 1}`;
      
      // Try to find a matching grounding chunk for this park to get a real map link
      const matchingChunk = groundingChunks.find((chunk: any) => 
        chunk.web?.title?.includes(name) || chunk.web?.uri?.includes(encodeURIComponent(name))
      );
      
      return {
        id: `found-${Date.now()}-${index}`,
        name: name,
        location: addressMatch ? addressMatch[1].trim() : 'Location unavailable',
        description: descMatch ? descMatch[1].trim() : 'A local park.',
        tasks: [], // New parks have no tasks initially
        googleMapsUrl: matchingChunk?.web?.uri,
        lat: latMatch ? parseFloat(latMatch[1]) : undefined,
        lng: lngMatch ? parseFloat(lngMatch[1]) : undefined
      };
    });

    return parks;
  } catch (error) {
    console.error("Error finding parks:", error);
    return [];
  }
};