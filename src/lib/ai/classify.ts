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
    prompt: `A solo software agency offers these services: ${agencyServices.join(", ")}.

A Reddit post was found via keyword search:
Title: "${postTitle}"
Content preview: "${postSnippet}"

CRITICAL: This tool finds LEADS for an agency — people/companies who NEED development work done and are LOOKING TO HIRE. You MUST distinguish between:

✅ REAL LEAD (isLead=true): Someone saying they NEED a developer/agency to build something for them. They have a project, problem, or idea they want built. They're hiring/buying.
Examples: "I need someone to build my website", "Looking for a developer to help with our app", "Need a full stack dev for our startup", "Looking for an agency to redesign our site", "Hiring freelance developer for project"

❌ NOT A LEAD (isLead=false): Someone offering their OWN services as a developer, sharing their own project, discussing tech casually, asking for advice, or anything that doesn't involve them hiring someone.
Examples: "I built X in React", "FOR HIRE - Full stack developer", "What framework should I use?", "Check out my new project", "As a solo dev I struggle with...", "Here's how I built...", showing off personal work

Scoring rules:
- intentScore 0.8-1.0: Actively looking to hire, has a project to build, asking "who can build X" or "need a developer"
- intentScore 0.4-0.7: Considering options, asking about tools but might hire someone
- intentScore 0-0.3: Just discussing, sharing their own work, offering services — NOT a lead
- temperature: hot = actively hiring with project/budget, warm = exploring options, cold = casual/not hiring
- serviceMatchScore: Score against the SPECIFIC agency services listed (e.g. if a post needs a smart contract and you offer Solidity dev, that's 1.0)`,
  });

  return object;
}
