
import { GoogleGenAI, Type } from "@google/genai";
import { FinanceMode, Transaction, AnalysisResult } from "../types";

const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Extracts the first JSON-like object from a string using regex
 */
const extractJson = (text: string): string => {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return match[0];
    return text.replace(/```json/g, "").replace(/```/g, "").trim();
  } catch (e) {
    return text;
  }
};

export const analyzeFinances = async (
  mode: FinanceMode,
  transactions: Transaction[]
): Promise<AnalysisResult> => {
  const ai = getAIInstance();
  
  const prompt = `Analyze the following financial transactions for a ${mode} profile. 
  Identify anomalies, calculate a health score (0-100), and summarize.
  
  Transactions: ${JSON.stringify(transactions)}
  
  Return ONLY the JSON matching the schema.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          healthScore: { type: Type.NUMBER },
          anomalies: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                reason: { type: Type.STRING },
                severity: { type: Type.STRING }
              },
              required: ["category", "amount", "reason", "severity"]
            }
          },
          categoryBreakdown: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.NUMBER }
              },
              required: ["name", "value"]
            }
          },
          trendAnalysis: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING },
                amount: { type: Type.NUMBER }
              },
              required: ["date", "amount"]
            }
          }
        },
        required: ["summary", "healthScore", "anomalies", "categoryBreakdown", "trendAnalysis"]
      }
    }
  });

  const cleaned = extractJson(response.text || "{}");
  return JSON.parse(cleaned);
};

export const extractTransactionFromText = async (
  text: string,
  mode: FinanceMode,
  availableCategories: string[]
): Promise<Partial<Transaction>> => {
  const ai = getAIInstance();
  
  const prompt = `Act as a banking SMS parser. Text: "${text}"
  
  Extract:
  1. amount: The PRIMARY transaction amount (Number only). Ignore "Available Bal".
  2. description: Merchant name or source (e.g., "Amazon", "Salary").
  3. category: Pick from [${availableCategories.join(', ')}].
  4. date: YYYY-MM-DD format.
  
  Return ONLY the JSON.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          amount: { type: Type.NUMBER },
          description: { type: Type.STRING },
          category: { type: Type.STRING },
          date: { type: Type.STRING }
        },
        required: ["amount", "description", "category", "date"]
      }
    }
  });

  if (!response.text) throw new Error("Empty response from AI");
  const cleaned = extractJson(response.text);
  return JSON.parse(cleaned);
};
