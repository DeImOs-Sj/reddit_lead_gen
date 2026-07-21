import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agencies } from "@/lib/db/schema";
import { extractAgencyProfile } from "@/lib/ai/extract-services";
import { desc } from "drizzle-orm";

export async function GET() {
  const rows = await db.select().from(agencies).orderBy(desc(agencies.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, siteUrl } = body as { name?: string; siteUrl?: string };

  if (!name || !siteUrl) {
    return NextResponse.json({ error: "name and siteUrl are required" }, { status: 400 });
  }

  const profile = await extractAgencyProfile(siteUrl);

  const [agency] = await db
    .insert(agencies)
    .values({
      name,
      siteUrl,
      extractedServices: profile.services,
      techStack: profile.techStack,
      toneSample: profile.toneSample,
      priceTierSignal: profile.priceTierSignal,
    })
    .returning();

  return NextResponse.json(agency, { status: 201 });
}
