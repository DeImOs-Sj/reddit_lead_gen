import { generateObject } from "ai";
import { z } from "zod";
import { strongModel } from "./groq";

const AgencyProfileSchema = z.object({
  services: z
    .array(z.string())
    .describe(
      "Specific services this agency offers, e.g. 'Shopify migrations', 'React Native apps', 'AI chatbot integration'",
    ),
  techStack: z.array(z.string()).describe("Technologies/frameworks the agency works with"),
  toneSample: z
    .string()
    .describe("A short representative sentence capturing the agency's writing tone/voice"),
  priceTierSignal: z
    .enum(["budget", "mid-market", "premium", "unknown"])
    .describe("Best-guess price positioning based on site copy"),
});

export type AgencyProfile = z.infer<typeof AgencyProfileSchema>;

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12000); // keep prompt small
}

/**
 * Personal-use variant: builds the same profile shape (services/techStack/tone/
 * price-tier) from pasted resume text instead of scraping an agency's website.
 * Used for a single-person freelancer watchlist, not a multi-tenant agency.
 */
export async function extractProfileFromResume(resumeText: string): Promise<AgencyProfile> {
  const { object } = await generateObject({
    model: strongModel,
    schema: AgencyProfileSchema,
    prompt: `You're analyzing a freelance developer's resume to build a gig-matching profile.

Resume:
"""
${resumeText.slice(0, 12000)}
"""

Extract the specific types of paid gigs/contracts this person could take on, their tech stack, a short tone sample (how they'd describe themselves), and price positioning. Be specific and cover the breadth of what they can do — e.g. "Full-stack Next.js/NestJS development", "Solidity smart contract development & audits", "DevOps/SRE — AWS, Kubernetes, observability", "AI/RAG chatbot & LLM integration", "Blockchain protocol engineering (EVM, Substrate)" — not vague catch-alls like "software development". These become the service list a lead-matching model scores Reddit gig posts against.`,
  });

  return object;
}

export async function extractAgencyProfile(siteUrl: string): Promise<AgencyProfile> {
  const res = await fetch(siteUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; leadgen-onboarding/0.1)" },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${siteUrl}: ${res.status}`);
  }

  const html = await res.text();
  const text = stripHtml(html);

  const { object } = await generateObject({
    model: strongModel,
    schema: AgencyProfileSchema,
    prompt: `You're analyzing a software/dev agency's website to build a targeting profile.

Website content (extracted text):
"""
${text}
"""

Extract the agency's actual services, tech stack, tone of voice, and price positioning. Be specific — "Shopify migrations" not "e-commerce", "React Native apps" not "mobile development" — so this can be matched precisely against lead requests later.`,
  });

  return object;
}
