
import { GoogleGenAI, Type } from "@google/genai";
import { LocationSuggestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getLocationSuggestions = async (
  query: string, 
  coords?: { lat: number; lng: number }
): Promise<LocationSuggestion[]> => {
  if (!query || query.length < 2) return [];

  try {
    const locationContext = coords 
      ? `O usuário está atualmente próximo às coordenadas Latitude ${coords.lat}, Longitude ${coords.lng}. Priorize locais e endereços que sejam próximos a este ponto ou na mesma cidade/região.` 
      : "Considere locais populares em grandes cidades do Brasil.";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `${locationContext} Forneça 5 sugestões de endereços reais, estabelecimentos ou locais públicos que correspondam ou contenham: "${query}". Retorne APENAS um array JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Nome curto do local ou estabelecimento" },
              address: { type: Type.STRING, description: "Endereço formatado (Rua, Número, Bairro, Cidade - UF)" }
            },
            required: ["title", "address"]
          }
        }
      }
    });

    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    // Fallback robusto com base na query
    return [
      { title: `${query} Center`, address: "Avenida Principal, 1000 - Centro" },
      { title: `Estação ${query}`, address: "Rua das Flores, s/n - Próximo ao metrô" }
    ].filter(s => s.title.toLowerCase().includes(query.toLowerCase()));
  }
};

/**
 * Uses Gemini to convert Lat/Lng to a readable address string.
 */
export const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Identifique o endereço ou local mais provável para as coordenadas Latitude: ${lat}, Longitude: ${lng} no Brasil. 
      Responda APENAS com o nome do local ou endereço curto e formatado (ex: "Shopping Center Norte - Travessa Casalbuono, 120"). 
      Não inclua explicações adicionais.`,
    });

    return response.text?.trim() || `Localização (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  } catch (error) {
    console.error("Error reverse geocoding with Gemini:", error);
    return `Coordenadas: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};
