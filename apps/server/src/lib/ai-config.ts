import { ChatOpenAI } from "@langchain/openai";

if (!process.env.NVIDIA_API_KEY) {
  throw new Error("NVIDIA_API_KEY is not set. Add it to apps/server/.env");
}

const baseConfig = {
  apiKey: process.env.NVIDIA_API_KEY,
  configuration: {
    baseURL: "https://integrate.api.nvidia.com/v1",
  },
};

/**
 * Fast, lightweight model for high-frequency, low-complexity calls:
 * contestant dialogue lines, diary room confessionals, short reactions.
 * No extended thinking - we want speed and personality, not deep reasoning.
 */
export const dialogueModel = new ChatOpenAI({
  ...baseConfig,
  model: "meta/llama-3.1-8b-instruct",
  temperature: 0.9, // higher for varied, characterful dialogue
  topP: 0.7,
  maxTokens: 256, // dialogue lines are short; no need for 1024+
});

/**
 * Heavier reasoning model for the director's structural decisions
 * (currently unused directly by code - director logic is still pure
 * heuristics - but available for when director decisions need real
 * judgment, e.g. evaluating whether a storyline has gone stale).
 */
export const directorModel = new ChatOpenAI({
  ...baseConfig,
  model: "nvidia/nemotron-3-ultra-550b-a55b",
  temperature: 1,
  topP: 0.95,
  maxTokens: 16384,
  modelKwargs: {
    reasoning_budget: 16384,
    chat_template_kwargs: { enable_thinking: true },
  },
});