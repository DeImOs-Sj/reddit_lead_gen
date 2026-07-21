import { generateObject } from "ai";
import { z } from "zod";
import { fastModel } from "./groq";

const ClassificationSchema = z.object({
  isLead: z
    .boolean()
    .describe("True if this post is someone genuinely looking for dev/agency help"),
  intentScore: z
    .number()
    .min(0)
    .max(1)
    .describe("0 = just discussing tech, 1 = explicitly asking for a developer/agency"),
  temperature: z
    .enum(["cold", "warm", "hot"])
    .describe(
      "cold = casually mentioned a tool/topic, no buying signal. warm = considering options / comparing. hot = actively looking to hire, has budget/timeline, or asking 'who can build X'.",
    ),
  serviceMatchScore: z
    .number()
    .min(0)
    .max(1)
    .describe("How well this lead matches the agency's specific service list (0 = no overlap, 1 = exact match)"),
  matchedService: z
    .string()
    .nullable()
    .describe("Which specific agency service this lead matches, or null if none"),
});

export type LeadClassification = z.infer<typeof ClassificationSchema>;

export async function classifyLead(params: {
  postTitle: string;
  postSnippet: string;
  agencyServices: string[];
}): Promise<LeadClassification> {
  const { postTitle, postSnippet, agencyServices } = params;

  const { object } = await generateObject({
    model: fastModel,
    schema: ClassificationSchema,
    prompt: `A software agency offers these services: ${agencyServices.join(", ")}.

A Reddit post was found via keyword search:
Title: "${postTitle}"
Content preview: "${postSnippet}"

Answer distinguishing a real buying signal from a casual mention. Example of the distinction that matters: "what's the best project management tool?" (a buying question, could be warm/hot) vs. "I just bought Notion and love it" (closed decision, not a lead, should be cold and isLead=false). Score serviceMatchScore against the SPECIFIC agency services listed above, not generic dev-related overlap.`,
  });

  return object;
}
