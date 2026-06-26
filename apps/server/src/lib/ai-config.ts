import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

declare const process: {
  env: {
    GOOGLE_API_KEY?: string;
  };
};

if (!process.env.GOOGLE_API_KEY) {
  throw new Error("GOOGLE_API_KEY is not set. Add it to apps/server/.env");
}

export const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.8, // higher = more varied dialogue/personality; tune later
  maxOutputTokens: 1024,
});