import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { watchlists } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const agencyId = searchParams.get("agencyId");

  if (!agencyId) {
    return NextResponse.json({ error: "agencyId is required" }, { status: 400 });
  }

  const rows = await db.select().from(watchlists).where(eq(watchlists.agencyId, agencyId));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { agencyId, keywords } = body as { agencyId?: string; keywords?: string[] };

  if (!agencyId || !keywords?.length) {
    return NextResponse.json({ error: "agencyId and keywords are required" }, { status: 400 });
  }

  const [watchlist] = await db
    .insert(watchlists)
    .values({ agencyId, keywords })
    .returning();

  return NextResponse.json(watchlist, { status: 201 });
}
