import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, leadStatusEnum } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const { status } = body as { status?: (typeof leadStatusEnum.enumValues)[number] };

  if (!status || !leadStatusEnum.enumValues.includes(status)) {
    return NextResponse.json({ error: "valid status is required" }, { status: 400 });
  }

  const [updated] = await db
    .update(leads)
    .set({ status })
    .where(eq(leads.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "lead not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
