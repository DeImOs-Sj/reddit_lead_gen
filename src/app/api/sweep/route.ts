import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agencies, watchlists, leads } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { searchReddit, fetchRedditPostPreview } from "@/lib/serper";
import { classifyLead } from "@/lib/ai/classify";
import { draftReply } from "@/lib/ai/draft-reply";

const MIN_INTENT_SCORE = 0.4;

export async function POST(req: Request) {
  const body = await req.json();
  const { agencyId } = body as { agencyId?: string };

  if (!agencyId) {
    return NextResponse.json({ error: "agencyId is required" }, { status: 400 });
  }

  const [agency] = await db.select().from(agencies).where(eq(agencies.id, agencyId));
  if (!agency) {
    return NextResponse.json({ error: "agency not found" }, { status: 404 });
  }

  const agencyWatchlists = await db
    .select()
    .from(watchlists)
    .where(eq(watchlists.agencyId, agencyId));

  const keywords = agencyWatchlists.flatMap((w) => w.keywords ?? []);
  const agencyServices = agency.extractedServices ?? [];

  let found = 0;
  let inserted = 0;
  const errors: string[] = [];

  for (const keyword of keywords) {
    let results;
    try {
      results = await searchReddit(keyword);
    } catch (err) {
      errors.push(`search failed for "${keyword}": ${(err as Error).message}`);
      continue;
    }

    found += results.length;

    for (const result of results) {
      // Dedupe: skip posts already surfaced for this agency.
      const [existing] = await db
        .select({ id: leads.id })
        .from(leads)
        .where(and(eq(leads.agencyId, agencyId), eq(leads.sourcePostUrl, result.url)));

      if (existing) continue;

      let classification;
      try {
        classification = await classifyLead({
          postTitle: result.title,
          postSnippet: result.content,
          agencyServices,
        });
      } catch (err) {
        errors.push(`classify failed for "${result.url}": ${(err as Error).message}`);
        continue;
      }

      if (!classification.isLead || classification.intentScore < MIN_INTENT_SCORE) {
        continue;
      }

      const preview = await fetchRedditPostPreview(result.url);

      let suggestedReply: string | null = null;
      try {
        suggestedReply = await draftReply({
          postTitle: result.title,
          postSnippet: result.content,
          matchedService: classification.matchedService,
          agencyName: agency.name,
          toneSample: agency.toneSample ?? "",
        });
      } catch (err) {
        errors.push(`draft-reply failed for "${result.url}": ${(err as Error).message}`);
      }

      const subredditMatch = result.url.match(/reddit\.com\/r\/([^/]+)/);

      const parsedPostedAt = result.publishedDate ? new Date(result.publishedDate) : null;
      const postedAt = parsedPostedAt && !isNaN(parsedPostedAt.getTime()) ? parsedPostedAt : null;

      await db.insert(leads).values({
        agencyId,
        source: "reddit",
        sourcePostUrl: result.url,
        authorUsername: preview.username,
        title: result.title,
        snippet: preview.bodyPreview ?? result.content,
        subreddit: subredditMatch ? subredditMatch[1] : null,
        postedAt,
        intentScore: classification.intentScore,
        serviceMatchScore: classification.serviceMatchScore,
        temperature: classification.temperature,
        suggestedReply,
        status: "new",
      });

      inserted += 1;
    }
  }

  return NextResponse.json({ keywordsSwept: keywords.length, found, inserted, errors });
}
