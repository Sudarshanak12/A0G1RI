
import { GoogleGenAI, Type } from "@google/genai";
import { FinanceMode, Transaction, AnalysisResult } from "../types";

const getAIInstance = () => {
  if (!process.env.API_KEY || process.env.API_KEY === 'your_gemini_api_key_here') {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Retries a function with exponential backoff.
 */
async function retry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED");
    if (retries > 0 && isRateLimit) {
      console.warn(`Rate limit hit. Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Advanced JSON Recovery: Strips markdown, handles accidental arrays,
 * fixes trailing commas, and extracts the core data object.
 */
const recoverJson = (text: string): any => {
  if (!text) throw new Error("EMPTY_RESPONSE");
  
  let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    
    if (start !== -1 && end !== -1 && end > start) {
      const jsonSnippet = cleaned.substring(start, end + 1);
      try {
        const fixedJson = jsonSnippet.replace(/,\s*([\}\]])/g, '$1');
        return JSON.parse(fixedJson);
      } catch (e2) {
        console.error("Critical: AI returned unparseable text:", text);
        throw new Error("MALFORMED_DATA");
      }
    }
    throw new Error("NO_DATA_FOUND");
  }
};

export const analyzeFinances = async (
  mode: FinanceMode,
  transactions: Transaction[]
): Promise<AnalysisResult> => {
  const ai = getAIInstance();
  
  const prompt = `Act as a financial auditor. Analyze these ${mode} transactions.
  Data: ${JSON.stringify(transactions)}
  
  Provide JSON:
  1. summary: behavioral overview.
  2. healthScore: 0-100.
  3. anomalies: [{category, amount, reason, severity}].
  4. categoryBreakdown: [{name, value}].
  5. trendAnalysis: [{date, amount}].`;

  return retry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Use Flash for higher quota
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    return recoverJson(response.text || "{}");
  });
};

export const extractTransactionFromText = async (
  text: string,
  mode: FinanceMode,
  availableCategories: string[]
): Promise<Partial<Transaction>> => {
  const ai = getAIInstance();
  
  const prompt = `Extract financial data. 
  Context: ${mode}
  Allowed Categories: [${availableCategories.join(', ')}]
  Text: "${text}"
  
  JSON Fields: amount (num), description (str), category (str), date (YYYY-MM-DD).`;

  try {
    return await retry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview", // Use Flash for higher quota
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

      const resultText = response.text;
      if (!resultText) throw new Error("NULL_RESPONSE");
      return recoverJson(resultText);
    });
  } catch (error: any) {
    if (error.message === "API_KEY_MISSING") throw error;
    throw new Error(error.message || "EXTRACTION_FAILURE");
  }
};
