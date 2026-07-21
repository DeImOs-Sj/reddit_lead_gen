export type SerperResult = {
  title: string;
  url: string;
  content: string;
  publishedDate: string | null;
  engine: string;
};

type SerperOrganicResult = {
  title: string;
  link: string;
  snippet?: string;
  date?: string;
};

type SerperResponse = {
  organic?: SerperOrganicResult[];
};

const SERPER_API_KEY = process.env.SERPER_API_KEY;

/**
 * Searches Reddit via Serper.dev (Google SERP data). Same search-index-discovery
 * principle as the SearXNG client (ideas.md §6.1) — no direct Reddit API/scrape.
 * Note: Serper's own ToS describes its data as "web-scraped" from Google, and its
 * free tier is a one-time signup credit, not a recurring monthly allowance —
 * treat as a bridge/dev option, not the final production discovery path.
 */
export async function searchReddit(keyword: string): Promise<SerperResult[]> {
  if (!SERPER_API_KEY) {
    throw new Error("SERPER_API_KEY is not set");
  }

  const query = `site:reddit.com ${keyword}`;

  // tbs=qdr:w restricts to the past week — without it, Google's index ranks by
  // relevance not recency, and a live test surfaced 2020-2023 posts (dead leads,
  // the hiring was resolved years ago) mixed in with real current threads.
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": SERPER_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, tbs: "qdr:w" }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Serper request failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as SerperResponse;
  const organic = data.organic ?? [];

  return organic
    .filter((r) => /reddit\.com\/r\/[^/]+\/comments\//.test(r.link))
    .map((r) => ({
      title: r.title,
      url: r.link,
      content: r.snippet ?? "",
      publishedDate: r.date ?? null,
      engine: "serper",
    }));
}

/**
 * Tier 2: a single plain page load of a specific Reddit post's public URL —
 * same category of request as a browser click or a link-unfurl feature.
 * Used only for posts that already passed the intent filter (ideas.md §6.2).
 */
export async function fetchRedditPostPreview(postUrl: string): Promise<{
  username: string | null;
  bodyPreview: string | null;
}> {
  try {
    const res = await fetch(postUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; leadgen-preview/0.1)" },
      cache: "no-store",
    });
    if (!res.ok) return { username: null, bodyPreview: null };

    const html = await res.text();

    const usernameMatch = html.match(/u\/([A-Za-z0-9_-]{3,20})/);
    const username = usernameMatch ? usernameMatch[1] : null;

    const descMatch = html.match(
      /<meta\s+name="description"\s+content="([^"]*)"/i,
    );
    const bodyPreview = descMatch ? descMatch[1] : null;

    return { username, bodyPreview };
  } catch {
    return { username: null, bodyPreview: null };
  }
}
