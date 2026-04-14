import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface Recommendation {
  productId: string;
  reason: string;
}

export async function getPersonalizedRecommendations(userPreferences: any, behaviorLogs: any[], products: any[]): Promise<Recommendation[]> {
  if (!process.env.GEMINI_API_KEY) return [];

  const prompt = `
    Based on the following user preferences and behavior logs, recommend 5 products from the catalog.
    
    User Preferences: ${JSON.stringify(userPreferences)}
    Recent Behavior: ${JSON.stringify(behaviorLogs.slice(-10))}
    Product Catalog: ${JSON.stringify(products.map(p => ({ id: p.id, name: p.name, category: p.category, tags: p.tags })))}
    
    Return a JSON array of objects with "productId" and "reason" (why this product matches).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              productId: { type: Type.STRING },
              reason: { type: Type.STRING }
            },
            required: ["productId", "reason"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
  }
}

export async function getSmartShoppingAdvice(query: string, budget: any, cart: any[]): Promise<string> {
  if (!process.env.GEMINI_API_KEY) return "AI Assistant is currently unavailable.";

  const prompt = `
    You are a smart shopping assistant. 
    User Query: "${query}"
    User Budget: ${JSON.stringify(budget)}
    Current Cart: ${JSON.stringify(cart)}
    
    Provide helpful, concise advice. If they are over budget, suggest alternatives or warn them.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    return response.text || "I'm not sure how to help with that right now.";
  } catch (error) {
    return "Error getting AI advice.";
  }
}
