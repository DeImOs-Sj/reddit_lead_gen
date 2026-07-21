import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const agencyId = searchParams.get("agencyId");

  if (!agencyId) {
    return NextResponse.json({ error: "agencyId is required" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(leads)
    .where(eq(leads.agencyId, agencyId))
    .orderBy(desc(leads.intentScore), desc(leads.surfacedAt));

  return NextResponse.json(rows);
}
