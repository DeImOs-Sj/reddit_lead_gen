import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { watchlists } from "../src/lib/db/schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const client = postgres(connectionString);
const db = drizzle(client);

const AGENCY_ID = "324f5968-2521-4e2e-aea0-159f120b2bec";

// Large rotating pool — real client/gig language, no blockchain
const GIG_POOL = [
  // "I need help with..." patterns — real client voice
  "need help with my website",
  "need help building a website",
  "help me with my business website",
  "i need someone to build a website for",
  "looking to get a website built",
  "want to build an app for my business",
  "need someone to create a mobile app",
  "i need an app built for",
  "looking for someone to develop an app",
  "help me build an app idea",

  // Freelancer search patterns
  "looking for a freelancer to help",
  "need a freelancer for my project",
  "want to hire a freelancer for",
  "looking for a freelance developer for",
  "need a freelance developer to",
  "find a freelancer to build",
  "hiring a freelancer for web",
  "looking to hire a freelancer",

  // AI / automation specific (user mentioned this)
  "need ai automation for",
  "looking for someone to automate",
  "help with ai integration",
  "need an ai chatbot for",
  "want to automate my business with ai",
  "looking for ai developer to help",
  "need help with ai workflow",

  // Tech project gigs
  "need a developer for my startup",
  "looking for tech cofounder to build",
  "need someone to build a saas",
  "help me build my startup idea",
  "looking for a technical partner to build",
  "need a full stack developer for project",
  "looking for a web developer to build",

  // E-commerce / specific
  "need help with my shopify store",
  "want to build an ecommerce site",
  "looking for shopify developer",
  "need a website for my small business",
  "want to create a landing page for",
  "need a custom dashboard built",

  // Direct hiring (for projects, not employment)
  "hiring a developer for a project",
  "looking to hire a developer for gig",
  "need a developer for contract work",
  "looking for contract developer",
  "hiring for a web project",
  "need a programmer for a project",

  // "Can someone" — common on Reddit
  "can someone build me a",
  "can someone help me build",
  "does anyone know a developer who",
  "recommend a developer for",

  // General
  "need a technical cofounder for my",
  "looking for someone to code",
  "need help developing my idea",
  "want to turn my idea into an app",
];

async function main() {
  // Clear old keywords
  const [existing] = await db
    .select()
    .from(watchlists)
    .where(eq(watchlists.agencyId, AGENCY_ID));

  if (existing) {
    await db.delete(watchlists).where(eq(watchlists.agencyId, AGENCY_ID));
    console.log("Deleted old watchlist");
  }

  await db.insert(watchlists).values({
    agencyId: AGENCY_ID,
    keywords: GIG_POOL,
  });

  console.log(`Seeded ${GIG_POOL.length} rotating gig keywords`);
  console.log("Sample:", GIG_POOL.slice(0, 5).join(", "));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
