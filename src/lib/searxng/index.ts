export type SearxngResult = {
  title: string;
  url: string;
  content: string;
  publishedDate: string | null;
  engine: string;
};

type SearxngResponse = {
  query: string;
  results: SearxngResult[];
};

const SEARXNG_BASE_URL = process.env.SEARXNG_BASE_URL ?? "http://localhost:8081";

/**
 * Searches Reddit via a self-hosted SearXNG instance (search-index discovery,
 * not a direct Reddit API/scrape — see ideas.md §6.1).
 */
export async function searchReddit(keyword: string): Promise<SearxngResult[]> {
  const query = `site:reddit.com ${keyword}`;
  const url = `${SEARXNG_BASE_URL}/search?q=${encodeURIComponent(query)}&format=json`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`SearXNG request failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as SearxngResponse;
  return data.results.filter((r) => r.url.includes("reddit.com/r/"));
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
