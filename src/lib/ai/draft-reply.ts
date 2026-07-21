import { generateText } from "ai";
import { strongModel } from "./groq";

/**
 * Drafts a suggested reply/DM as plain copyable text. Never sent, never
 * posted, never prefilled into Reddit — the agency copies it manually if
 * they want it (ideas.md §4.7 / §6.5: no outreach automation of any kind).
 */
export async function draftReply(params: {
  postTitle: string;
  postSnippet: string;
  matchedService: string | null;
  agencyName: string;
  toneSample: string;
}): Promise<string> {
  const { postTitle, postSnippet, matchedService, agencyName, toneSample } = params;

  const { text } = await generateText({
    model: strongModel,
    prompt: `Draft a short, non-salesy Reddit comment reply for this post. It will be shown to a human as a copyable suggestion only — it is never sent automatically.

Post title: "${postTitle}"
Post content: "${postSnippet}"

Agency: ${agencyName}, specializing in: ${matchedService ?? "general software development"}.
Agency's tone of voice, match this style: "${toneSample}"

Rules:
- Sound like a helpful person replying on Reddit, not an ad.
- No links, no "check out my agency", no signature.
- 2-4 sentences max.
- If genuinely useful, offer a specific, concrete piece of advice from the post before any soft mention of being able to help.`,
  });

  return text.trim();
}
