
import { GoogleGenAI, Type } from "@google/genai";
import { Knowledge, Message } from '../types';

let ai: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
    if (ai) {
        return ai;
    }

    if (!process.env.API_KEY) {
        throw new Error("API Key not found. Please set the API_KEY environment variable for the application.");
    }
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return ai;
}


// --- Knowledge Base Retrieval ---
const findRelevantChunks = (query: string, knowledgeBase: Knowledge, count = 3): string[] => {
    if (!knowledgeBase || !knowledgeBase.texts) return [];
    
    const queryWords = new Set(query.toLowerCase().split(/\s+/).filter(word => word.length > 2));
    if (queryWords.size === 0) return [];

    const scoredChunks = knowledgeBase.texts.map(textChunk => {
        const lowerChunk = textChunk.toLowerCase();
        let score = 0;
        for (const word of queryWords) {
            if (lowerChunk.includes(word)) {
                score++;
            }
        }
        return { score, text: textChunk };
    });

    return scoredChunks
        .sort((a, b) => b.score - a.score)
        .filter(chunk => chunk.score > 0)
        .slice(0, count)
        .map(chunk => chunk.text);
};


// --- Gemini API Interaction ---

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        answer: {
            type: Type.STRING,
            description: "A detailed, helpful, and friendly answer to the user's question. Base the answer on the provided context.",
        },
        spoken_summary: {
            type: Type.STRING,
            description: "A concise, single-sentence summary of the answer, suitable for text-to-speech. Should be less than 200 characters.",
        },
        suggested_questions: {
            type: Type.ARRAY,
            description: "Three relevant follow-up questions that the user might ask.",
            items: { type: Type.STRING },
        },
    },
    required: ["answer", "spoken_summary", "suggested_questions"],
};

interface GeminiResponse {
    answer: string[];
    spoken_summary: string;
    suggested_questions: string[];
}


export const generateResponse = async (query: string, chatHistory: Message[], knowledge: Knowledge): Promise<GeminiResponse> => {
    try {
        const geminiClient = getAiClient();
        const relevantChunks = findRelevantChunks(query, knowledge);

        const context = relevantChunks.length > 0
            ? `Use the following information from the knowledge base to answer the question:\n\n---\n${relevantChunks.join('\n---\n')}\n---`
            : "I couldn't find direct information in the knowledge base, but try to answer in a general, helpful way.";

        const systemInstruction = `You are an intelligent and friendly voice assistant.
        Your task is to answer user queries accurately, based on the provided context.
        If the information is not available in the context, politely state that you do not have the information.
        Maintain a professional and helpful tone.
        Always provide an answer, a spoken summary, and three suggested questions in the required JSON format.`;

        const recentHistory = chatHistory.slice(-4).map(m => `${m.speaker}: ${m.text || m.textParts?.join(' ')}`).join('\n');
        
        const prompt = `${context}\n\nRecent conversation history:\n${recentHistory}\n\nCurrent user question: "${query}"`;

        const response = await geminiClient.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.5,
            }
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        
        if (result && result.answer && result.spoken_summary && Array.isArray(result.suggested_questions)) {
            return {
                answer: [result.answer], // Return as array to match Message type
                spoken_summary: result.spoken_summary,
                suggested_questions: result.suggested_questions,
            };
        } else {
            console.error("Invalid JSON structure from Gemini:", result);
            throw new Error("Received an invalid response structure from the AI.");
        }

    } catch (e) {
        console.error("Gemini Service Error:", e);
        const errorMessage = (e as Error).message.includes("API Key not found")
            ? "The Google AI API Key is not configured for this application. Please contact the administrator."
            : "Sorry, I'm having trouble connecting to the smart assistant right now. Please try again later.";
        
        // Return a fallback response
        return {
            answer: [errorMessage],
            spoken_summary: errorMessage,
            suggested_questions: [
                "What services are available?",
                "How can I subscribe?",
                "What are the business hours?"
            ]
        };
    }
};
