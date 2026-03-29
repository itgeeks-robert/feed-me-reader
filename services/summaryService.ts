import { GoogleGenAI, Type } from "@google/genai";

/**
 * Service for summarizing articles using Gemini AI.
 */
export async function summarizeArticle(title: string, text: string): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";

  const prompt = `
    Summarise this article in exactly 3 bullet points, each under 15 words. 
    Return only a JSON array of 3 strings, nothing else.

    Article Title: ${title}
    Article Text: ${text}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
        },
      },
    });

    const textResponse = response.text;
    if (!textResponse) {
      throw new Error('Empty response from AI');
    }

    const summary = JSON.parse(textResponse.trim());
    if (!Array.isArray(summary) || summary.length !== 3) {
      throw new Error('Invalid summary format received');
    }

    return summary;
  } catch (error) {
    console.error('Error summarizing article:', error);
    throw error;
  }
}
