import { createGroq } from "@ai-sdk/groq";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// Fast/cheap model for high-volume classification passes (intent, temperature).
// openai/gpt-oss-20b supports Groq's structured-output (json_schema) mode.
export const fastModel = groq("openai/gpt-oss-20b");

// Stronger model for extraction and drafting, where quality matters more than
// per-call cost (these run once per agency onboarding / once per surfaced lead).
export const strongModel = groq("openai/gpt-oss-120b");
