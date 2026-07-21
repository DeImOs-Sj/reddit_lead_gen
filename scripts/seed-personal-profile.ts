import { config } from "dotenv";
config({ path: ".env.local" });

import { readFileSync } from "fs";
import { eq } from "drizzle-orm";

const PROFILE_NAME = "Shlok Jagtap";

const NATURAL_GIG_KEYWORDS = [
  "need a full stack developer",
  "looking for a freelance developer",
  "need a blockchain developer",
  "looking for a solidity developer",
  "need help building a smart contract",
  "need a devops engineer",
  "looking for someone to set up AWS infrastructure",
  "need help with kubernetes",
  "looking for a react developer",
  "need a backend developer for nestjs",
  "need an AI engineer",
  "looking for someone to build a chatbot",
  "need help with a rag pipeline",
  "hiring a web3 developer",
  "looking for a smart contract audit",
];

async function main() {
  const { db } = await import("../src/lib/db");
  const { agencies, watchlists } = await import("../src/lib/db/schema");
  const { extractProfileFromResume } = await import("../src/lib/ai/extract-services");

  const [existing] = await db
    .select()
    .from(agencies)
    .where(eq(agencies.name, PROFILE_NAME));

  if (existing) {
    console.log(`Profile already exists: ${existing.id}`);
    console.log(`Dashboard: /dashboard?agencyId=${existing.id}`);
    return;
  }

  const resumeText = readFileSync(
    new URL("./resume.local.txt", import.meta.url),
    "utf-8",
  );

  console.log("Extracting gig-matching profile from resume via Groq...");
  const profile = await extractProfileFromResume(resumeText);

  const [created] = await db
    .insert(agencies)
    .values({
      name: PROFILE_NAME,
      siteUrl: "personal-profile",
      extractedServices: profile.services,
      techStack: profile.techStack,
      toneSample: profile.toneSample,
      priceTierSignal: profile.priceTierSignal,
    })
    .returning();

  console.log(`Created profile: ${created.id}`);
  console.log("Services:", profile.services);

  await db.insert(watchlists).values({
    agencyId: created.id,
    keywords: NATURAL_GIG_KEYWORDS,
  });

  console.log(`Seeded ${NATURAL_GIG_KEYWORDS.length} watchlist keywords.`);
  console.log(`Dashboard: /dashboard?agencyId=${created.id}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
