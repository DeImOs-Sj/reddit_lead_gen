# RedditLeads (working name) — Lead Generation for Software Agencies via Reddit/X

> Status: concept → pre-build. Last updated 2026-07-14.
> Research basis: `/last30days` scan of the Reddit lead-gen tool market (2026-06-14 to 2026-07-14), saved raw data at `~/Documents/Last30Days/reddit-lead-generation-tools-for-software-agencies-raw-v3.md`, plus a follow-up competitor-complaint/feature-gap pass (WebSearch on Redreach/GummySearch-alternative reviews + a live scan saved at `~/Documents/Last30Days/redreach-and-reddit-lead-generation-tool-complaints-feature-requests-raw-complaints-v1.md`, thin live-data yield — the review-site findings carried the signal).

---

## 1. One-liner

A tool for software/dev agencies and freelancers that scans Reddit (and optionally X) for people actively asking for developers, then helps the agency reach that person **before** competitors do — using the agency's own service profile and its competitors' client base as targeting signals.

---

## 2. Why now — market research findings

This section exists so decisions below aren't made blind. Findings from a live 30-day scan (Reddit, X, TikTok, Instagram, HN, LinkedIn, GitHub, Digg):

### 2.1 The category is proven, not speculative
- **GummySearch** (the closest prior-art tool — Reddit audience research for founders) had **135,000+ signups** and was profitable at **~$35K MRR with ~10,000 paying customers at $48/month**.
- It **shut down in late 2025** — not from lack of demand, but because it **couldn't reach a commercial licensing deal with Reddit** after Reddit's 2023 API pricing overhaul. Full account deletion completes December 2026.
- **Takeaway:** the willingness to pay ~$48/mo for Reddit lead/audience intelligence is proven. The thing that kills tools in this space is the data-access model, not the product idea.

### 2.2 Reddit has materially tightened access in 2026 — this changes the build
- Since **May 2026**, unauthenticated `old.reddit.com/*.json` requests return **403 Forbidden**. Reddit is also forcing login for old.reddit.com generally.
- Reddit's User Agreement (revised through March 2026) **explicitly prohibits automated collection** outside the official API or a separate written agreement.
- Reddit has **sued Anthropic (2025)** and pursued **Reddit v. SerpApi (late 2025)** over unauthorized scraping — this is an active enforcement posture, not a dormant clause.
- Official commercial Data API pricing: **~$0.24 per 1,000 requests**, enterprise agreements from **~$12,000/year**.
- **Takeaway:** any architecture that depends on unauthenticated scraping or headless-browser stealth against Reddit directly is now a legal and continuity risk, not just a technical one. This has to be a first-class constraint on the architecture (see §6), not an afterthought.

### 2.3 The competitive field, post-GummySearch
A second wave of tools has already filled the gap. Known live players (from search, not exhaustive):

| Tool | Angle | Notes |
|---|---|---|
| **GummySearch** | Reddit audience research | Dead (Nov 2025 shutdown, API cost) — the cautionary tale |
| **Linkeddit** | Reddit marketing tool | Positions as a direct GummySearch replacement |
| **SubredditSignals** | Reddit monitoring | Direct alternative-to-GummySearch positioning |
| **Octolens** | Social listening → lead gen | Broader than Reddit-only |
| **Redreach** | Reddit lead gen + DM automation + **competitor monitoring** | The category leader. **Already ships competitor-audience mining**: add your site + competitors → auto-finds relevant keywords and "hidden opportunities to access competitors' audiences." Starts at $19/mo. AI-drafts replies but stops at discovery+suggestion — see §2.5 for the documented gap this leaves open |
| **CatchIntent / AiLeads / Okara / Leadverse / LeadsKing / D7 Lead Finder** | AI-scored Reddit/B2B lead finders | Newer entrants, all pitch AI intent-scoring over raw keyword match — this is now the baseline expectation, not a differentiator |
| **Replymer / Reddinbox / trend-seeker** | GummySearch alternatives | Smaller/newer entrants; Reddinbox synthesizes insights instead of a raw mention feed |
| **DM Dad** | Reddit outreach automation | Bulk-DM focused, Chrome-extension style |
| **"Reddit Sentinel"** | AI sales agent for Reddit | Listed alongside general AI-SDR tools |
| **ReddLeads** | Reddit lead finder | Listed on AlternativeTo |
| **PainOnSocial / Awario / F5Bot** | Pain-point / mention monitoring | PainOnSocial scores pain points 0–100 (signal-quality framing, not a raw feed); F5Bot is free but reviewers call out heavy false-positive noise |

**Takeaway (revised):** the "scan Reddit, find intent, DM them" mechanic is fully commoditized, and the market is more crowded than a first pass suggests — 10+ live competitors, not 5. **Competitor-audience mining is not unique to this idea — Redreach already ships it.** What's still not found anywhere in this scan: matching a lead against the *agency's own specific service menu* (not generic niche keywords), and an intent-staging/lead-temperature system that distinguishes "casually mentioned a tool" from "actively looking to buy" (see §2.5 — this is Redreach's own documented weak spot). Those two are the real differentiation now — see §4.

### 2.4 What users actually complain about (signal from Reddit itself)
From r/SaaS thread *"For those doing community-led growth — what's still broken about the Reddit/forum 'lead finder' tools?"*:
- **Staleness beats volume.** *"the firehose is the trap... volume goes stale fast... a 2h-old thread beats ten day-old ones because the first good reply wins."* → speed-to-first-reply is the #1 product metric, not the size of the lead list.
- **Personalization/tone matters more than scale.** One builder's own hand-rolled tool worked because *"I easily got it to not sound robotic with a small bit of prompting."*
- **Shadowbanning is real and happens to good-faith builders**, not just spammers (HN: *"I got shadowbanned building a Reddit tool"*).
- Growth hackers are already doing this **manually**: TikTok creators are teaching a "search `[niche] + nightmare/scam` on Reddit" technique for sourcing ad angles and leads — validates the underlying behavior, but it's currently manual and slow.

**Product implication:** win on **freshness + relevance-to-agency-services + non-spammy human-in-the-loop send**, not on raw scan volume or full DM automation.

### 2.5 What reviewers say is actually wrong with the category leader (Redreach) — this changes the "manual-only" calculus
A follow-up pass specifically targeting Redreach reviews and GummySearch-alternative complaints (2026-07-14) surfaced three concrete, named findings that matter more than the general market scan above:

- **No intent-staging.** Reviewers note Redreach treats "what's the best project management tool?" (a buying question) and "I just bought Notion and love it" (a closed decision, no longer a lead) **the same way** — there's no system for staging leads by how close they are to a purchase decision. This is a real, unclaimed gap.
- **The "execution gap" is Redreach's most-cited weakness, not a strength.** Reviewer quote: Redreach can surface "30 perfect leads weekly with AI-suggested replies," but *"manually editing, posting, and managing accounts takes hours."* Reviewers list **requires manual work** as where Redreach falls short — meaning the market's actual complaint about the category leader is "too much manual work," which cuts directly against this project's manual-only design (§4.5, §6.5) unless the time-cost is addressed some other way. **This is why §4.7 (reply-text assist) and §5's lead-temperature feature exist — they answer this exact documented gap without reopening the automation/ban-risk question**, because neither one sends or posts anything.
- **Noise/false-positive complaints concentrate in the cheap/free tier.** F5Bot (free, keyword-only alerts) is named specifically for false positives. Tools that get praised instead score or synthesize rather than just listing raw mentions (Reddinbox synthesizes; PainOnSocial scores 0–100). **Takeaway: a raw ranked feed reads as the *weak* end of this market, not a neutral baseline** — the lead-temperature/intent-staging feature (§4.6) is also what keeps this project out of that bucket.
- **Pricing reality check:** Redreach itself starts at **$19/month** (plus a $12 one-time 3-day pass), not $48–199/mo. That's materially below the Starter tier this doc originally proposed in §9 — see the pricing revision there.

---

## 3. Target user & core value proposition

**Target user:** small-to-mid software/web dev agencies, dev studios, and serious freelancers (1–30 people) who currently get clients via referrals, Upwork, or cold outreach and want a cheaper, faster inbound-intent channel.

**Core value prop:** "We watch Reddit and X for people asking for exactly what you build, match them against your actual service list, show you who your competitors' clients are so you can go after the same market, and get you a ready-to-send, personalized message in under the time it takes for someone else to reply first."

---

## 4. Differentiation (what nobody else in §2.3 is doing)

1. **Agency profile ingestion, not just keyword watching.** The agency onboards by pointing at their own site/portfolio; the app extracts services offered (e.g., "Shopify migrations," "React Native apps," "AI chatbot integration"), tech stack, price tier signals, and case studies. This becomes the matching schema for every lead, instead of a generic keyword list the user has to build by hand. **Still not found anywhere else in the scan — this is the strongest differentiator.**
2. **Competitor-client mining — parity feature, not a differentiator. Revised after research.** Given a competitor agency's URL, extract their published client list / case studies / testimonials (public data, not scraped-behind-auth). Cross-reference those client names against Reddit/X activity (are they hiring again? complaining? churned?) to surface **poaching opportunities**. **§2.5 correction: Redreach already ships this exact category of feature** (add competitors → auto-find their audience/keyword opportunities). Keep this feature — it's still useful — but position it as "we do this narrower and deeper (actual client names, not just keywords)," not as something nobody else offers.
3. **Service-to-intent matching, not just niche keyword matching.** A generic tool finds "looking for a developer" posts. This tool ranks those posts against the *specific agency's* service menu so a Shopify-only shop doesn't get flooded with Rails-backend leads.
4. **Speed-to-surface as the core metric**, directly responding to the "firehose is the trap" complaint in §2.4 — near-real-time polling on high-intent subreddits, with an alerting SLA (e.g., "surfaced within 15 minutes of post") as a marketed feature.
5. **Display-and-link, no automated sending at all.** The app surfaces the post (title, snippet, subreddit, extracted username) on the agency's dashboard and links straight to the live Reddit thread. The agency's own person reads it and comments or DMs **directly on Reddit, in their own words, using their own account** — the app never posts, sends, or automates any action on Reddit itself. This is the safest possible design (zero automated-behavior risk on Reddit's side) and is explained fully in §6.4. **Note the tension with §2.5: reviewers call this exact "you still have to do it manually" pattern Redreach's #1 weakness — points 6 and 7 below exist specifically to answer that without reintroducing automation.**
6. **Intent-staging / lead temperature — new, added from competitor-gap research (§2.5).** Score each lead cold/warm/hot based on language signal ("considering options" vs. "actively looking for a dev this week" vs. "just hired someone") instead of Redreach's flat keyword-match treatment. Directly answers a named, reviewer-documented gap in the category leader.
7. **Copy-paste reply/DM text assist — new, added from competitor-gap research (§2.5).** The app drafts a suggested comment or DM in a text box on the dashboard, using the agency's own case-study language as few-shot context. It is never sent, posted, or prefilled into Reddit — the agency copies it themselves if they want it, or writes their own. This restores the time-saving value that manual-only (§4.5) gives up, without touching Reddit at all, and directly targets the "manually editing, posting, and managing accounts takes hours" complaint reviewers make about Redreach.

---

## 5. Feature list

### Phase 0 — MVP (prove the loop works for one agency)
- [ ] Agency onboarding: paste site URL → auto-extract services, tech stack, tone-of-voice sample (from About/case study pages)
- [ ] Manual override: agency edits/confirms extracted service tags
- [ ] Keyword/niche watchlist (seed list + user-added) — no subreddit polling, just search terms
- [ ] Discovery pipeline: SearXNG sweep → candidate post URLs + snippets + username (where extractable)
- [ ] Intent classifier: is this person actually asking for dev help vs. just discussing tech? (LLM classification pass on the snippet)
- [ ] Service-match score: rank each lead against the agency's service tags
- [ ] **Lead temperature (cold/warm/hot):** stage each lead by purchase-decision proximity, not just topical match — directly answers Redreach's documented "no intent-staging" gap (§2.5)
- [ ] **Reply/DM text assist:** LLM-drafted suggested comment/DM shown in a copyable text box, using the agency's case-study language — never sent or posted, purely a manual copy-paste aid (§4.7)
- [ ] Lead card: shows post title, snippet/preview, subreddit, extracted **username**, lead temperature, freshness timestamp, suggested reply text, and a **direct link to the live Reddit thread**
- [ ] Lead inbox UI: ranked feed of lead cards
- [ ] Manual status log: agency marks a lead as contacted/replied/won/lost themselves after acting on Reddit — **no send/comment automation of any kind**

### Phase 1 — Retention & moat features
- [ ] Competitor watchlist: add competitor agency URLs → extract client names/case studies (parity with Redreach's competitor-audience feature, §2.3 — differentiate on depth: real client names, not just keyword suggestions)
- [ ] Competitor-client Reddit/X monitoring: flag when a known client of a competitor posts something (re-hiring signal, complaint signal, contract-ending signal)
- [ ] Speed SLA dashboard: median time-to-surface, time-to-first-contact, response rate — sold as the headline metric
- [ ] Keyword auto-discovery: suggest new search terms/niche subreddit names to include in the SearXNG query based on the agency's service tags (e.g., detect that "Shopify migration" agencies should also search "site:reddit.com/r/shopify" phrasing)
- [ ] X/Twitter lead scanning (same search-index-first approach, applied to X — see §6.6)
- [ ] CRM-lite: pipeline view (New → Contacted → Replied → Proposal → Won/Lost), simple kanban
- [ ] Slack/email daily digest of top N leads
- [ ] Team seats — multiple people per agency account, assign leads to team members

### Phase 2 — Scale & defensibility
- [ ] Auto-tuning relevance model per agency (learns from which leads the agency actually contacted/won)
- [ ] Reply-rate benchmarking across the platform (anonymized, aggregate: "agencies like yours get X% reply rate with this message style")
- [ ] White-label / agency-of-agencies tier (marketing agencies reselling to their dev-agency clients)
- [ ] Public API for agencies to pipe leads into their own CRM (HubSpot, Pipedrive, Notion)
- [ ] Expansion beyond Reddit/X: Hacker News "Who's Hiring"/"Ask HN," relevant Discord/Slack communities (where ToS-permitted), LinkedIn (careful — LinkedIn scraping enforcement is even stricter than Reddit's)
- [ ] Browser extension: surface a "this looks like a lead" badge while the agency owner browses Reddit normally

---

## 6. Data acquisition strategy — the most important section

This is the section that decided GummySearch's fate. Get this wrong and the product dies to a ToS enforcement action or an API-cost death spiral, regardless of how good the matching logic is.

### 6.1 The core distinction: querying a search index vs. scraping Reddit's servers
Reddit's 2026 enforcement (§2.2) targets **automated collection directly from Reddit's own infrastructure** — hitting `reddit.com/*.json`, crawling listing/comment endpoints at bot volume, or headless-browsing logged-in sessions at scale. That is a fundamentally different act from **querying a third-party search engine's index** (Google, Bing, or an aggregator like SearXNG) for `site:reddit.com <keyword>` results. In the second case:
- You're not sending automated requests to Reddit at all during discovery — the search engine already crawled and indexed the page under its own crawl agreement with Reddit.
- Reddit's User Agreement governs access to *Reddit's* services; it has no authority over how Google or Bing choose to serve their own index.
- This is exactly how a human "growth hacker" finds leads manually (search `site:reddit.com "need a developer"`), just automated and run continuously.

**Revised primary discovery strategy:** run keyword/niche queries through a self-hosted **SearXNG** instance (aggregating Google, Bing, Brave, etc.) as the default, continuous discovery layer — not a fallback. This is lower legal exposure than direct Reddit API/scraping and avoids Reddit API rate-limit/cost entirely for the discovery step.

### 6.2 What search-engine discovery gets you, and where the pipeline stops (no Reddit API, no automation, at all)
- **Search results give you:** post URL, title, a snippet of text, sometimes a rough date, and often the author's username (Reddit search snippets frequently include "u/username" or the post's byline in the indexed text). Usually enough to run the intent classifier (§5 MVP) and decide if it's worth surfacing.
- **The app never calls Reddit's API, and there is no Tier-2 fetch loop.** The pipeline is simply: SearXNG search → parse the result → if the username isn't already in the snippet, do **one plain page load of the post's own public URL** to read the byline and pull a content preview for the lead card — the exact same request a browser makes when a human clicks that link, and the same category of request any link-preview/unfurl feature (Slack, Discord, iMessage) makes millions of times a day. This is not polling, not bulk crawling, and not authenticated access — it's a single page render triggered only for posts that already passed the intent filter.
- **What ends at the lead card:** username, post title/snippet, subreddit, freshness timestamp, link to the live thread. That's the entire deliverable. No comment-thread scraping, no upvote-count tracking over time, no continuous re-fetching of the same post.
- **What happens after the lead card:** nothing automated. The agency's person clicks through to the real Reddit thread and comments or DMs the extracted username **themselves, on Reddit's own site, in their own account** — see §6.5.

### 6.3 On the tools you mentioned (Camoufox, SearXNG, Crawl4AI) — revised assessment

| Tool | What it actually is | Fit for this product |
|---|---|---|
| **SearXNG** | Self-hosted, privacy-respecting metasearch engine aggregating Google/Bing/Brave/etc. | **Primary discovery layer** (revised from earlier draft). Self-host it, run scheduled `site:reddit.com <niche keyword>` queries per agency watchlist. Zero Reddit-side requests, zero Reddit API cost, no ToS exposure at the discovery stage. This is now the backbone of Tier 1 in §6.2, not a secondary aid.
| **Camoufox** | Anti-detect Firefox fork built for stealth browser automation (fingerprint spoofing) | Not needed for Reddit discovery anymore — search-engine querying replaces that use case entirely. Keep it in the toolbox for **competitor-client mining** (§4.2): scraping competitor agencies' own public marketing sites (case studies, client logos) where there's no Reddit-style ToS/enforcement regime to worry about.
| **Crawl4AI** | LLM-oriented crawler/browser automation framework | Same as Camoufox — best fit is crawling **competitor agency websites** for the client-mining feature, not Reddit itself. If you ever need to render a JS-heavy competitor site, this is the tool for that job, not for the Reddit pipeline.

**Bottom line (revised):** SearXNG-driven search-index discovery is the entire pipeline on the Reddit side — cheap, low-risk, no Reddit API, no Reddit account needed by the app at all. The only Reddit-side network call is a plain page load of a specific post URL to pull the username/preview for the lead card, which is the same kind of request any link-unfurl feature makes. Camoufox/Crawl4AI are reserved for competitor-website scraping only (§4.2), where they were always the better fit anyway.

### 6.4 Fallback/backfill data sources worth evaluating
- **Arctic Shift** (a public Reddit data mirror) — surfaced during the research run as a backfill source for post/comment scores. Worth a legal review before relying on it commercially; treat as supplementary, not primary.
- **ScrapeCreators-style paid data providers** — several tools in this space (per the research run's own tooling) use a paid third-party data API as backup when direct platform access is rate-limited. Consider this pattern for X/Twitter specifically, where official API pricing is steep for small agencies.

### 6.5 Outreach: display-and-link only — no send automation, no automation-adjacent tricks either
- **The app does not send DMs, does not post comments, and does not prefill Reddit's compose form.** It shows the lead card (§6.2) with a plain link to the live Reddit thread and the extracted username. The agency's person opens Reddit themselves, reads the full context, and comments on the thread or DMs the user **entirely through Reddit's normal interface, logged in as themselves.**
- **Why this over an "assisted-send" prefilled link:** even a prefilled compose URL is a step toward automation-flavored outreach, and the research surfaced a real case of a builder getting shadowbanned running a Reddit tool (§2.4) plus a dedicated competitor feature ("Redreach — Reddit DM Automation") that exists specifically in that gray zone. Not touching that mechanism at all — not even a convenience prefill — keeps the product entirely on the "we found you something to read" side of the line, with zero automated-behavior surface on Reddit.
- The app's job ends at surfacing a good, fresh, well-matched lead. Everything from "read the thread" onward is the agency's own manual judgment and typing, same as if they'd found the post themselves.

### 6.6 X/Twitter
Same principle applies: prefer the official X API (paid tiers) or a licensed data partner over cookie-based scraping of a logged-in session, which risks account suspension and ToS violation on X's side too. Treat X as a Phase 1 add-on, not a launch blocker — Reddit is the higher-signal, cheaper-to-access source per the research.

---

## 7. Architecture (proposed)

```
┌────────────────────┐     ┌───────────────────┐     ┌────────────────────┐
│ SearXNG (self-hosted)│───▶│ Discovery workers  │───▶│  Candidate leads    │
│ site:reddit.com +    │     │ (scheduled sweep   │     │  store (Postgres)   │
│ per-agency keywords  │     │  per keyword/niche)│     │  URL+snippet+date   │
└────────────────────┘     └───────────────────┘     └─────────┬──────────┘
                                                                  │
                                                                  ▼
                                                     ┌───────────────────────┐
                                                     │ LLM intent classifier │
                                                     │ (cheap/fast model —   │
                                                     │  is this a real lead?)│
                                                     └─────────┬─────────────┘
                                                                  │ passes threshold
                                                                  ▼
                                                     ┌───────────────────────┐
                                                     │ Plain page fetch      │
                                                     │ (no API, no login —   │
                                                     │  just read the post's │
                                                     │  own public URL for   │
                                                     │  username + preview)  │
                                                     └─────────┬─────────────┘
                                                                  │
                                                                  ▼
                                                     ┌───────────────────────┐
                                                     │ Service-match scoring │
                                                     │ (vs. agency profile)  │
                                                     └─────────┬─────────────┘
                                                                  │
                                                                  ▼
                                                     ┌───────────────────────┐
                                                     │  Lead feed / inbox     │
                                                     │  (per-agency ranked,   │
                                                     │  card = title+snippet+ │
                                                     │  username+link)        │
                                                     └───────────┬────────────┘
                                                                  │
                                                                  ▼
                                                     Agency's person clicks through,
                                                     reads on Reddit, comments/DMs
                                                     manually from their own account
```

- **Backend:** Node/TypeScript or Python (FastAPI) — either fine; no Reddit API SDK (PRAW etc.) needed at all under this design, which removes a dependency.
- **Discovery engine:** self-hosted **SearXNG** instance (own infra or a small VPS), queried on a schedule per agency's keyword/niche watchlist. This is the only ingestion path — no subreddit polling, no Reddit API, no Reddit account for the app.
- **Job/queue layer:** for scheduling SearXNG sweeps and the occasional plain-page-fetch-for-preview step (BullMQ / Celery / a managed queue). Volume is small — one fetch per pre-qualified lead.
- **Database:** Postgres for structured data (agencies, leads, competitors, outreach log); consider a vector store (pgvector) for service-tag/intent embedding similarity matching.
- **LLM usage:** service-tag extraction (agency onboarding), intent classification on the search snippet, service-match scoring on the fetched preview text, lead-temperature staging (§4.6), and reply-text drafting (§4.7) — the last one produces a copyable suggestion only, nothing is sent or posted automatically.
- **Frontend:** whatever the team already knows; a ranked-feed UI is not exotic — standard dashboard patterns apply. The lead card's only call-to-action is "open on Reddit."
- **Hosting:** if deploying on Vercel, the SearXNG instance itself needs a place to run continuously — it's a long-lived service, not a request-response function, so it's a better fit for a small dedicated VPS/container (or a managed SearXNG host) than for Vercel Functions. The scheduled sweep + preview-fetch jobs are a good fit for Vercel Queues or a cron-triggered Function; the dashboard/API stays on Vercel as normal.

---

## 8. Core data model (draft)

- **Agency**: id, name, site_url, extracted_services[], tech_stack[], tone_sample, price_tier_signal
- **CompetitorAgency**: id, agency_id (owner), name, site_url, extracted_clients[]
- **Watchlist**: id, agency_id, keywords[], x_queries[]
- **Lead**: id, source (reddit/x), source_post_url, author_username, title, snippet, subreddit/context, posted_at (best-effort, from snippet/page), surfaced_at, intent_score, service_match_score, status (new/contacted/replied/won/lost — set manually by the agency)
- **CompetitorClientSignal**: id, competitor_agency_id, client_name, matched_source_post_url, signal_type (re-hiring/complaint/churn-indicator)

---

## 9. Monetization

**Revised after §2.5 pricing check:** the original tiers here were priced against GummySearch's $48/mo *before* checking the current live competitor's actual price. Redreach — the category leader today — starts at **$19/month**. Pricing the Starter tier at $49–69/mo would put this product 2.5–3.5x above the leader's entry price with a narrower automation feature set (by design, §6.5). That gap needs closing:

- **Starter** (~$19–29/mo): 1 agency profile, up to 5 keyword/niche watchlists, Reddit-only, daily digest, lead temperature + reply-text assist included (these are cheap to run and are the whole point of differentiation — don't gate them behind a higher tier).
- **Growth** (~$59–89/mo): unlimited watchlists, X add-on, competitor-client mining, near-real-time alerts (tighter SearXNG sweep interval), team seats (up to 3).
- **Agency/White-label** (custom): multi-client management for marketing agencies reselling this to their dev-agency clients, API access, priority sweep frequency.

The search-index-first discovery design in §6 keeps per-lead Reddit-side cost near-zero (one plain page fetch per pre-qualified lead, not continuous polling or paid API calls), so margin at this lower price point should still be workable — the pricing correction is about matching what the market actually charges, not about needing more revenue per user to survive. Keep LLM classification/drafting cost per lead in the gross margin math regardless — that's the real variable cost now, not Reddit access.

---

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Search engines change indexing/rate limits, or SearXNG's upstream engines throttle it | Discovery layer is an abstraction (SearXNG today, swap in Brave Search API/Exa/Serper if needed) — don't hard-couple to one search backend |
| Account bans from outreach behavior | Not applicable to the app itself — no send/comment automation exists (§6.5), so there's nothing on the app's side that can trigger a ban. Worth still educating agencies on Reddit's own community norms so *their* manual outreach doesn't read as spammy, but that's a user-education note, not a product risk |
| Low signal-to-noise (irrelevant "leads") | Invest in the service-match scoring model early; let agencies give thumbs-up/down feedback to retrain relevance per-account |
| Competitor tools already commoditizing this — and one of the two original differentiators (competitor-client mining) turned out to already exist at Redreach | Lead with agency-service matching (§4.1, still unclaimed) + intent-staging/lead-temperature (§4.6, answers a documented Redreach gap) — don't lead with competitor-client mining, it's parity not novelty |
| The reply-text-assist / lead-temperature gap gets closed by a competitor before this ships | Both features are cheap to build (LLM classification/drafting, no new infra) — ship them in the MVP (§5 Phase 0), not as a later add-on, since they're currently the strongest reason to switch |
| Legal exposure from competitor-site scraping | Scrape only public marketing pages (case studies, testimonials) — no login-walled or ToS-prohibited competitor data |
| Preview-fetch step gets blocked by Reddit rate-limiting at scale | Volume here is naturally small (one fetch per lead that already passed the intent filter); if it ever becomes an issue, fall back to showing just the search-engine snippet with no preview fetch rather than retrying aggressively |

---

## 11. Suggested build workflow / milestones

1. **Week 1–2:** Self-hosted SearXNG instance, agency onboarding + service extraction (LLM), keyword watchlist, scheduled sweep worker.
2. **Week 3–4:** Intent classification + service-match scoring + lead-temperature staging (§4.6) + reply-text assist (§4.7), plain-page-fetch preview step (username + snippet), ranked lead feed UI with link-out cards.
3. **Week 5:** Dogfood on your own agency (or a design-partner agency) — validate lead relevance and freshness before adding more sources.
4. **Week 6–8:** Manual outreach log/CRM-lite, Slack/email digest, competitor-client mining v1 (Phase 1 features).
5. **Week 9+:** X/Twitter search-index discovery, team seats, pricing page, first paid design partners.

Ship the MVP to 3–5 design-partner agencies before building anything in Phase 2 — the research shows the core mechanic (find + rank + link out) is table stakes; the differentiators (§4) are what need real agency feedback to get right.

---

## 12. Open questions for you to decide before/while building

1. **Agency profile source of truth** — auto-extract only, or allow manual service-tag entry from day one? (Recommend: both, auto-extract as a starting draft.)
2. **Competitor-client mining scope** — public case-study/testimonial pages only, or also LinkedIn company-employee lists (higher legal risk, LinkedIn enforces at least as strictly as Reddit)? (Recommend: public site data only for v1.) — *note: this feature is now parity with Redreach, not a differentiator (§2.5), so it's lower priority than it was originally scoped.*
3. **X/Twitter timing** — Phase 1 as planned, or launch Reddit-only and defer X entirely until there's proven pull? (Recommend: defer — Reddit research shows stronger, cheaper signal.)
4. **Pricing model** — flat subscription tiers (§9) vs. usage-based (per-lead-surfaced)? Resolved for now: flat tiers, repriced to $19–29/mo Starter to match Redreach's actual entry price (§9) rather than the original $48/mo GummySearch-anchored guess.
5. **Search backend choice** — self-hosted SearXNG (free, more ops overhead) vs. a paid search API (Brave Search API, Serper, Exa — less ops, per-query cost). Worth prototyping both early since this is now the single most-used component in the pipeline.
6. **How aggressively to market the lead-temperature + reply-assist features as "the thing Redreach doesn't do"** — direct comparison marketing (naming Redreach) vs. just building it better without calling out the competitor by name. Worth deciding once you have a few design-partner agencies who've actually used both.




so create a workflow of this entire reddit lead. Last time i saw people are hiring web devs or backend or frotnend devs giving them small gigs apart from that
  i can see there are various sub reddits that gives agenices the contracts or are looking out for agency firms. so i need to build a lead tracker applciation which can
  send me the leads as soon as someone posts on reddit please design it end to end including testing also please make sure you are not getting rate limited by searxng or
  you can just use duck duck go browser for unlimited scraping. i dont want to scrape reddit bascially it will be a set of keywords or sentences that exactly matches the
  reddit post title and it just gives me that reddit post and then i manually write a comment or dm for that guy