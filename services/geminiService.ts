import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, ReceiptData, Category } from '../types';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseReceiptImage = async (base64Image: string): Promise<ReceiptData> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Analyze this receipt image. Extract the following information:
      - Total Amount (number)
      - Date (ISO string format YYYY-MM-DD if found, otherwise null)
      - Merchant Name (string)
      - Category (Best guess from: Food, Transport, Housing, Utilities, Shopping, Entertainment, Health, Education, Other)
      
      Return JSON.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            date: { type: Type.STRING },
            merchant: { type: Type.STRING },
            category: { type: Type.STRING },
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ReceiptData;
    }
    throw new Error("No data returned");
  } catch (error) {
    console.error("Gemini Receipt Parsing Error:", error);
    throw error;
  }
};

export const getSpendingInsights = async (transactions: Transaction[]): Promise<{ title: string; message: string; type: 'warning' | 'positive' | 'neutral' }[]> => {
  try {
    // Summarize data to send to avoid token limits if many transactions
    const summary = transactions.slice(0, 50).map(t => `${t.date}: ${t.description} - $${t.amount} (${t.category})`).join('\n');
    
    const prompt = `
      Analyze these recent financial transactions and provide 3 short, actionable insights or tips for the user.
      Focus on spending habits, potential savings, or budget adherence.
      
      Transactions:
      ${summary}

      Return a JSON array of objects with keys: title, message, type (warning, positive, or neutral).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              message: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['warning', 'positive', 'neutral'] }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return [];
  } catch (error) {
    console.error("Gemini Insights Error:", error);
    return [{ title: "AI Unavailable", message: "Could not generate insights at this time.", type: "neutral" }];
  }
};

export const categorizeDescription = async (description: string): Promise<Category | null> => {
  try {
    const prompt = `Categorize the expense description "${description}" into exactly one of these categories: Food, Transport, Housing, Utilities, Shopping, Entertainment, Health, Education, Other. Return only the category name.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    const text = response.text?.trim();
    if (text) return text as Category;
    return null;
  } catch (e) {
    return null;
  }
}
