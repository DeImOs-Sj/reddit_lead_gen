# Phases — build log & handoff doc

> If you're a different AI/session picking this up: read this file top to bottom before touching code. It tells you what's done, what's verified working, what's known-broken, and why specific choices were made. `ideas.md` is the product spec (features, differentiation, market research); this file is the build/implementation log.

---

## 0. One-liner

Lead-gen tool for software agencies: search Reddit via a self-hosted SearXNG instance (not Reddit's API, not scraping — see ideas.md §6), classify + score leads against the agency's own service menu (extracted via LLM from their site), and surface them on a dashboard with a copy-paste reply suggestion. **No outreach automation** — the agency manually clicks through to Reddit and acts themselves.

---

## 1. Tech stack (locked in, don't re-litigate without reason)

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router), TypeScript | Single deploy target for dashboard + API routes |
| DB | Postgres + Drizzle ORM | Typed, lightweight, fast cold starts |
| LLM | **Groq** (`@ai-sdk/groq` via Vercel AI SDK v6) | User has a Groq API key, wants to use it — see §4 for the two gotchas this caused |
| UI | Tailwind v4 + shadcn/ui (`base` style, not `radix`) | Fast to build a real dashboard |
| Discovery engine | **Self-hosted SearXNG**, Docker, local for now | Search-index discovery, not Reddit API/scraping — see ideas.md §6.1. Local-only per user's explicit request ("self host on local so I can test it") — production hosting is an open question, not decided |
| Local DB | Postgres in Docker (same compose file) | Simplest local dev setup, no external signup needed |
| Auth | **Not implemented yet.** Single-agency assumption throughout (no multi-tenant login) | Deferred — see §7 next steps |

**Not used, and why:** Vercel Marketplace Neon Postgres (using local Docker Postgres instead per user's local-first request), Anthropic/Vercel AI Gateway (user provided a Groq key directly), Clerk (no auth built yet), PRAW/Reddit OAuth API (deliberately excluded — see ideas.md §6).

---

## 2. How to run this locally

```bash
# 1. Start SearXNG + Postgres
docker compose up -d

# 2. Push DB schema (only needed after schema changes)
npx drizzle-kit push --force

# 3. Run the app
npm run dev
```

Then visit `http://localhost:3000` → redirects to `/onboarding`.

**Ports** (chosen because 8080/5432/5433 were already taken by other local projects on this machine — check `docker-compose.yml` if setting up fresh elsewhere, these might not need to change):
- SearXNG: `http://localhost:8081`
- Postgres: `localhost:5434` (container internal port is still 5432)
- Next.js: `http://localhost:3000`

**Env file:** `.env.local` (gitignored, confirmed via `git check-ignore`). Contains `GROQ_API_KEY`, `DATABASE_URL`, `SEARXNG_BASE_URL`. **Never commit this file.** If you're a fresh AI session and don't have the Groq key, ask the user — do not invent one.

---

## 3. What's built and verified working (Phase 0 MVP progress)

Ran an actual end-to-end test during this session — not just typechecked, actually exercised:

- [x] `docker-compose.yml` — SearXNG (JSON API enabled via `searxng/settings.yml`) + Postgres, both running locally
- [x] Drizzle schema (`src/lib/db/schema.ts`) — `agencies`, `competitorAgencies`, `watchlists`, `leads`, `competitorClientSignals` tables, pushed to local Postgres, verified with `\dt`
- [x] SearXNG client (`src/lib/searxng/index.ts`) — `searchReddit(keyword)` hits SearXNG's JSON API with `site:reddit.com <keyword>`, confirmed returning real Reddit results
- [x] Groq AI functions (`src/lib/ai/`):
  - `extract-services.ts` — fetches an agency's site, strips HTML, LLM extracts services/tech-stack/tone/price-tier. **Tested live against vercel.com — correctly extracted their actual product list.**
  - `classify.ts` — scores a lead's intent (0-1), temperature (cold/warm/hot), and service-match score against the agency's specific services (ideas.md §4.6, the Redreach-gap feature)
  - `draft-reply.ts` — drafts a copy-paste reply suggestion, never sent/posted (ideas.md §4.7)
- [x] API routes: `POST/GET /api/agencies`, `POST/GET /api/watchlists`, `POST /api/sweep` (the core pipeline), `GET /api/leads`, `PATCH /api/leads/[id]`
- [x] Onboarding page (`/onboarding`) — form: agency name, site URL, keywords → creates agency + watchlist, redirects to dashboard
- [x] Dashboard page (`/dashboard`) — lead feed, "Run sweep now" button, lead cards showing temperature badge, intent/match scores, copyable suggested reply, status buttons (contacted/replied/won/lost), link to the live Reddit thread
- [x] `npm run build` passes clean, `tsc --noEmit` passes clean

**Live test result** (this session, against real Groq + real SearXNG + real Reddit search results): created an agency from `vercel.com`, added 2 keyword watchlist entries, ran a sweep → found 10 candidate posts, classified all, inserted 3 real leads with correct intent scores (0.4–0.85), correct temperature staging (hot/warm), and coherent drafted replies. **The core pipeline works end-to-end.**

---

## 4. Known issues / real findings from this session (read before continuing)

1. **Groq structured-output model gotcha.** `llama-3.3-70b-versatile` and `llama-3.1-8b-instant` do **not** support Groq's `json_schema` response format (used by `generateObject` in AI SDK). Switched to `openai/gpt-oss-120b` (strong) and `openai/gpt-oss-20b` (fast) — these are Groq-hosted GPT-OSS models that do support structured outputs. If you add more LLM calls, check https://console.groq.com/docs/structured-outputs#supported-models before picking a model for anything using `generateObject`.

2. **Reddit's bot-verification wall blocks the Tier-2 page fetch, most of the time.** `fetchRedditPostPreview()` in `src/lib/searxng/index.ts` does a plain `fetch()` on the specific post URL to pull the username (ideas.md §6.2's "Tier 2" design). In live testing, Reddit served a "Please wait for verification" bot-challenge page instead of the real post, so `authorUsername` came back `null` for all 3 leads in the test run. **This is expected and acceptable, not a bug to fight** — trying to defeat Reddit's bot detection (stealth headers, headless browser, etc.) would reopen the exact ToS risk ideas.md §6 deliberately avoided. Current behavior (fail gracefully, show `null`, let the human see the username when they click through to the real thread) is the correct design given this constraint. Do not "fix" this by adding stealth/evasion tooling.

3. **Self-hosted SearXNG's free upstream engines rate-limit/CAPTCHA fast — confirmed twice now, worse than first thought.** First occurrence: after ~5-10 queries, Brave/DuckDuckGo/Startpage went into CAPTCHA/suspended state. **Second occurrence (same day, 2026-07-14, ~30 min later):** added `bing`, `mojeek`, `presearch` as extra engines in `searxng/settings.yml` to work around the first suspension — they worked for a couple of test queries, then got suspended too within another handful of requests ("access denied" for mojeek/presearch, CAPTCHA for the rest). **Every free scraped engine hit the wall, not just the default three.** This is a hard constraint of scraping any public search engine's HTML from one IP, not a per-engine fluke.
   - **User decision (2026-07-14): wait out the cooldown rather than add a paid API key right now.** Don't re-test by hammering `/api/sweep` or SearXNG directly while diagnosing future issues — it was the rapid repeated testing (mine + the user's) that burned through the free budget in under an hour. Space out test queries.
   - Cooldown duration is unknown — could be minutes or hours, no way to check except retrying.
   - When ready to fix properly: Brave Search API (official REST API, not scraped, 2,000 free queries/month) is the recommended path, per ideas.md §12 open question #5. Needs a Brave API key from the user — do not add this unilaterally, it was explicitly deferred.
   - This needs to be resolved before Phase 1 (near-real-time alerts) is meaningful — right now, "near-real-time" is bottlenecked by how often you can query without getting CAPTCHA'd.

4. **Watchlist keyword quality matters a lot — natural phrasing vs. marketing taglines.** Real-world test: a user-onboarded agency's watchlist had keywords like *"Digital marketing agency for startups"* and *"Data-driven performance marketing India"* — these read like SEO meta-description taglines, not phrases a person would actually post on Reddit. A `site:reddit.com "Digital marketing agency for startups"` style query is unlikely to match real posts even with engines healthy. **This isn't a code bug, it's a keyword-input quality problem** (same class of issue `last30days`'s own skill docs call a "keyword trap" — overly-literal/tagline phrasing doesn't match how people actually write posts). Worth adding either: (a) onboarding guidance telling the agency to enter keywords the way a *customer* would phrase a request ("need a developer for my startup", not "we offer startup development services"), or (b) an LLM pass that rewrites a pasted tagline into natural search phrasing before it's saved to the watchlist. Not fixed yet — flagging for whoever picks this up next.

4. **No auth, no multi-tenancy yet.** Every API route takes a bare `agencyId` with zero access control. Fine for local single-user testing, **not fine to deploy publicly as-is.**

5. **`postedAt` is usually null.** SearXNG doesn't reliably return `publishedDate` for Reddit results in testing. Not a blocker (freshness is a nice-to-have per ideas.md §2.4, not core), but worth knowing if you build the "speed-to-surface" dashboard feature (§4.4/§5 Phase 1) — you may need another signal for post age.

---

## 5. File map (what a fresh AI needs to know exists)

```
docker-compose.yml            # SearXNG + Postgres, local dev
searxng/settings.yml          # SearXNG config — JSON format enabled here
drizzle.config.ts             # points at .env.local's DATABASE_URL
.env.local                    # gitignored — GROQ_API_KEY, DATABASE_URL, SEARXNG_BASE_URL

src/lib/db/schema.ts          # all 5 tables
src/lib/db/index.ts           # drizzle client

src/lib/searxng/index.ts      # searchReddit(), fetchRedditPostPreview()
src/lib/ai/groq.ts            # fastModel / strongModel (Groq, gpt-oss-20b / gpt-oss-120b)
src/lib/ai/extract-services.ts# agency onboarding LLM extraction
src/lib/ai/classify.ts        # intent + temperature + service-match scoring
src/lib/ai/draft-reply.ts     # copy-paste reply draft (never sent/posted)

src/app/api/agencies/route.ts
src/app/api/watchlists/route.ts
src/app/api/sweep/route.ts    # the core pipeline — read this first to understand the flow
src/app/api/leads/route.ts
src/app/api/leads/[id]/route.ts

src/app/onboarding/page.tsx
src/app/dashboard/page.tsx
src/app/dashboard/dashboard-client.tsx
src/components/lead-card.tsx
```

---

## 6. Phase 0 MVP checklist (cross-reference with ideas.md §5)

- [x] Agency onboarding + service extraction
- [ ] Manual override UI for extracted service tags (not built — extraction result is used as-is right now)
- [x] Keyword watchlist
- [x] SearXNG discovery pipeline
- [x] Intent classifier
- [x] Service-match score
- [x] Lead temperature staging (§4.6)
- [x] Reply/DM text assist (§4.7)
- [x] Lead card UI (title, snippet, subreddit, username-if-available, temperature, link)
- [x] Lead inbox / ranked feed
- [x] Manual status log (contacted/replied/won/lost buttons)

**Phase 0 is functionally complete for a single agency, local-only.** What's missing before this is demo-able to a real design-partner agency: manual service-tag editing, and a decision on the SearXNG rate-limiting problem (§4.3 above).

---

## 7. Next steps (in priority order)

1. **Wait out the current SearXNG cooldown (§4.3)** before doing any more sweep testing — as of 2026-07-14, all free engines (brave, duckduckgo, startpage, mojeek, presearch) are suspended from repeated testing. Space out requests when retesting. Resolve properly with a Brave Search API key when the user's ready (they explicitly deferred this).
1b. **Fix watchlist keyword quality (§4.4)** — add guidance or an LLM rewrite pass so onboarding doesn't save marketing-tagline keywords verbatim; natural customer-phrasing keywords are what actually match Reddit posts.
2. **Manual service-tag override UI** on the onboarding flow — let the agency edit/confirm the LLM-extracted services before it starts scoring leads against them.
3. **Auth** (Clerk, per ideas.md's original recommendation) once there's more than one agency using this.
4. **Competitor-client mining** (ideas.md §5 Phase 1) — not started.
5. **Decide production hosting** for SearXNG (currently local-only per explicit instruction) — a small VPS/container, per ideas.md §7.
6. **Deploy target** — not decided yet. ideas.md assumed Vercel; current build uses local Docker Postgres instead of Neon, so the deploy story needs revisiting when this moves beyond local testing.

---

## 8. Decisions from ideas.md that still apply (don't relitigate without new information)

- No Reddit API, no scraping Reddit directly — search-index discovery only (ideas.md §6.1).
- No outreach automation of any kind — not even a compose-prefill link (ideas.md §6.5). This session's build respects that: `draftReply()` output is copy-paste only, nothing is sent anywhere.
- Competitor-client mining is parity with Redreach, not a differentiator — the real differentiators are agency-service-menu matching (built) and lead-temperature/reply-assist (built, this session, directly answering Redreach's documented "execution gap" complaint).
- Pricing target: $19-29/mo Starter tier, matching Redreach's actual price — not the original $48/mo GummySearch-anchored guess.
