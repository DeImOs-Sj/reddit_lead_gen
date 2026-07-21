import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { agencies } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export default async function Home() {
  const [profile] = await db
    .select({ id: agencies.id })
    .from(agencies)
    .orderBy(desc(agencies.createdAt))
    .limit(1);

  redirect(profile ? `/dashboard?agencyId=${profile.id}` : "/dashboard");
}
