import { GoogleGenAI, Type, Chat } from "@google/genai";
import { Transaction, ReceiptData, Category } from '../types';

// Initialize Gemini
// The API key is securely loaded from the environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to clean JSON string (remove markdown code blocks if present)
const cleanJson = (text: string): string => {
  return text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
};

export const parseReceiptImage = async (base64Image: string): Promise<ReceiptData> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Analyze this receipt image. Extract the following information:
      - Total Amount (number)
      - Date (ISO string format YYYY-MM-DD if found, otherwise use today's date)
      - Merchant Name (string, use "Unknown Merchant" if not found)
      - Category (Select strictly from: Food, Transport, Housing, Utilities, Shopping, Entertainment, Health, Education, Other)
      
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
      const jsonStr = cleanJson(response.text);
      return JSON.parse(jsonStr) as ReceiptData;
    }
    throw new Error("No data returned from AI");
  } catch (error) {
    console.error("Gemini Receipt Parsing Error:", error);
    throw error;
  }
};

export const getSpendingInsights = async (transactions: Transaction[], currency: string = '$'): Promise<{ title: string; message: string; type: 'warning' | 'positive' | 'neutral' }[]> => {
  try {
    if (transactions.length === 0) {
        return [{ 
            title: "No Data Yet", 
            message: "Add some transactions to see AI-powered insights here.", 
            type: "neutral" 
        }];
    }

    // Summarize data to send to avoid token limits if many transactions
    // Send last 30 transactions for better context, sorted by date desc
    const recentTransactions = transactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 30);

    const summary = recentTransactions.map(t => 
        `${t.date}: ${t.description} - ${currency}${t.amount} (${t.category})`
    ).join('\n');
    
    const prompt = `
      You are a financial advisor. Analyze these recent transactions (Currency: ${currency}).
      Provide exactly 3 short, helpful insights or tips.
      1. Identify spending patterns (e.g., "You spent a lot on Coffee").
      2. Suggest budget improvements.
      3. Point out anything unusual or positive.
      
      Transactions:
      ${summary}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  message: { type: Type.STRING },
                  type: { type: Type.STRING },
                },
                required: ["title", "message", "type"]
              }
            }
          }
        }
      }
    });

    if (response.text) {
      const jsonStr = cleanJson(response.text);
      const data = JSON.parse(jsonStr);
      
      // Map and validate types
      return (data.insights || []).map((i: any) => ({
        title: i.title || 'Insight',
        message: i.message || '',
        type: ['warning', 'positive', 'neutral'].includes(i.type?.toLowerCase()) ? i.type.toLowerCase() : 'neutral'
      }));
    }
    return [];
  } catch (error) {
    console.error("Gemini Insights Error:", error);
    return [{ title: "AI Unavailable", message: "Unable to generate insights. Please check your connection or API key configuration.", type: "neutral" }];
  }
};

export const categorizeDescription = async (description: string): Promise<Category | null> => {
  try {
    const prompt = `Categorize the expense "${description}" into one of these categories: Food, Transport, Housing, Utilities, Shopping, Entertainment, Health, Education, Salary, Freelance, Investment, Other.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    category: { 
                        type: Type.STRING, 
                    }
                }
            }
        }
    });
    
    const text = response.text;
    if (text) {
        const jsonStr = cleanJson(text);
        const json = JSON.parse(jsonStr);
        return json.category as Category;
    }
    return null;
  } catch (e) {
    console.error("Categorization Error", e);
    return null;
  }
}

export const createFinancialChatSession = (transactionContext: string, currency: string): Chat => {
  const model = 'gemini-3-pro-preview'; 
  const systemInstruction = `You are a smart, friendly, and concise financial advisor assistant embedded in the "SmartSpend AI" app.
  User's Currency Preference: ${currency}
  
  Below is a summary of the user's current financial data. Use this to answer their questions accurately.
  
  ${transactionContext}
  
  Guidelines:
  1. Be helpful and encouraging about their finances.
  2. If they ask about specific numbers (e.g. "How much did I spend on food?"), use the provided context to answer.
  3. If the data isn't in the context (e.g. transactions from last year), politely say you only see the recent summary provided.
  4. Keep responses brief and easy to read on a mobile device. Use Markdown for bolding key figures.
  5. Your name is "SmartSpend Bot".
  `;

  return ai.chats.create({
    model,
    config: {
      systemInstruction,
    }
  });
};