import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";

const AGENCY_ID = "324f5968-2521-4e2e-aea0-159f120b2bec";
const MIN_INTENT_SCORE = 0.25;
const KEYWORDS_PER_SWEEP = 7; // pick 7 random from the pool

const sql = postgres(process.env.DATABASE_URL!);

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Returns true if this post is a REAL client gig (not discussion, advice, self-promo, or fantasy)
function isRealGig(title: string, snippet: string): boolean {
  const t = `${title} ${snippet || ""}`.toLowerCase();
  
  // --- HARD EXCLUSIONS (if ANY match, NOT a gig) ---
  
  // Self-promotion / offering services
  if (/(for\s*hire|forhire|hire\s*me|offering\s+services|available\s+for\s+hire|open\s+to\s+work|looking\s+for\s+work|seeking\s+f(reelan)?ce|my\s+portfolio|check\s+out\s+my|i\s+(can|will)\s+build|i\s+(built|create|made|developed)\s+(a|an|my|this|one)|i\s+(am|m)\s+a\s+(developer|freelancer|designer)|(freelance|web|app)\s+\w+\s+(available|for\s+hire)|i\s+built\s+(a|an|this)\s+(free|tool|app|website|platform)|i\s+have\s+\d+\s+years)/.test(t)) return false;

  // Discussion / advice / questions
  if (/(how\s+(do|can|to|did|would)\s+(i|you|we|anyone)|should\s+(i|you|we)|what\s+(are|is|do|should|would|tools?)|those\s+of\s+you|best\s+\w+\s+(for|to|platform|tool)|advice\s+(for|on|about|needed)|tips?\s+(for|on|about)|recommend|am\s+i\s+underpaid|rate\s+my|roast\s+my|review\s+my|has\s+anyone|does\s+anyone|land\s+(your|my|a)\s+(first|new)|how\s+to\s+get\s+(started|into|a\s+job)|what\s+do\s+you\s+(think|use)|any\s+(advice|tip|suggestion)|the\s+change\s+that\s+helped|do\s+you\s+(guys|all|really)|(can|does)\s+\w+\s+(really|actually)\s+help|are\s+we\s+(massively|over)|how\s+do\s+people|would\s+you\s+use\s+(a|this)|if\s+you\s+(only\s+)?had\s+\$|will\s+it\s+work|everyone\s+can\s+build|almost\s+nobody|but\s+how\?!)/i.test(t)) return false;

  // Non-tech / fantasy / gaming / personal projects
  if (/(magic\s+system|campaign\s+idea|rpg|dungeon|mothershiprpg|for\s+a\s+novel|book\s+(idea|series)|studen|homework|assignment|build\s+(me\s+)?a\s+pc|pc\s+(build|gaming|parts|for)|apple\s+photos|alternative\s+to|free\s+cv|tailoring)/i.test(t)) return false;

  // Personal journey / "I want to build X myself"
  const journeyRe = /days?\s+into\s+validating|just\s+started\s+(my|a)\s+(startup|side.?project)|i\s+want\s+to\s+(learn|become|start|get\s+into)|decided\s+to\s+(build|create|make)/i;
  if (journeyRe.test(t)) return false;

  // --- INCLUSION: must have clear hiring intent ---
  
  // Strong hiring signals (any one is enough)
  const hiring = [
    /\[hiring\]/i,
    /hiring\s+(a|an|the|someone|a\s+\w+\s+)?\w*(developer|dev|coder|programmer|engineer|freelancer|designer|intern|contractor|specialist|expert|builder)/i,
    /(need|looking\s+(for|to\s+hire)|want\s+(to\s+hire|a|an|someone)|find\s+(a\s+)?)\s+[\w\s]*(freelancer|developer|dev(?:\s+to)?|coder|programmer|agency|consultant|engineer|co.?founder|partner|team|person\s+who)/i,
    /(need|looking\s+(for|to)|want)\s+someone\s+(to\s+build|to\s+create|to\s+develop|to\s+help|who\s+can\s+build|who\s+can\s+help)/i,
    /help\s+(me|us)\s+(build|create|develop|design|set\s+up|automate|integrate|launch|with|find)/i,
    /build\s+(me|us|a|an)\s+(app|website|web\s+app|mobile\s+app|platform|dashboard|saas|ecommerce|shopify|landing\s+page)/i,
    /need\s+(a|an|some|help)\s+\w*(app|website|web\s+app|mobile\s+app|platform|dashboard|saas|ecommerce|shopify|landing\s+page|site|store)\s+(built|developed|created|made|designed|for)/i,
    /looking\s+(for|to)\s+(a|an|the|someone\s+to\s+build|a\s+\w+\s+developer|a\s+\w+\s+dev|a\s+freelancer|a\s+web\s+developer)/i,
    /hiring\s+.*\b(for|to\s+build|remote|contract|project|freelance|gig)\b/i,
  ];
  
  const hasHiringSignal = hiring.some(re => re.test(t));
  if (!hasHiringSignal) return false;

  // Must relate to tech/agency services
  const tech = /(app|website|web|software|saas|platform|mobile|ai|chatbot|automation|ecommerce|shopify|dashboard|full.?stack|frontend|backend|developer|code|program)/i;
  if (!tech.test(t)) return false;

  return true;
}

function scoreIntent(title: string, snippet: string) {
  if (!isRealGig(title, snippet)) return 0;
  
  const t = `${title} ${snippet || ""}`.toLowerCase();
  let score = 0.3; // base for passing the gig check
  
  if (/\[hiring\]|hiring\s+(a|an|remote|freelance|developer)/i.test(t)) score += 0.3;
  if (/(need|looking\s+for|want)\s+(a\s+)?(freelancer|developer|dev|co.?founder)\s+to\s+(build|help|create|develop)/i.test(t)) score += 0.2;
  if (/(help\s+(me|us)\s+build|build\s+(me|us)\s+(a|an|my|our))/i.test(t)) score += 0.2;
  if (/\$\d+|paid|budget|contract|hourly|salary/i.test(t)) score += 0.2;
  if (/(for\s+(my|our|this|a)\s+(startup|business|company|project|idea))/i.test(t)) score += 0.1;
  if (/(founding\s+engineer|co.?founder)/i.test(t)) score += 0.1;
  
  return Math.min(1, score);
}

// Service match — no crypto/blockchain, focused on real services
function scoreServiceMatch(title: string, snippet: string) {
  const t = `${title} ${snippet || ""}`.toLowerCase();
  const servicePatterns: [string, RegExp][] = [
    ["Full-stack web development", /(next\.?js|react|typescript|full.?stack|frontend|backend|web\s+app|website|landing\s+page)/],
    ["AI/RAG chatbot & LLM integration", /(ai|llm|chatbot|rag|gpt|openai|machine.?learning|automation|workflow)/],
    ["React Native mobile development", /(react\s+native|mobile\s+app|ios|android|flutter|app\s+development)/],
    ["DevOps & cloud infrastructure", /(aws|kubernetes|docker|devops|terraform|cloud|deploy)/],
    ["E-commerce development", /(shopify|ecommerce|woocommerce|store|shop|sell\s+online)/],
  ];
  for (const [svc, re] of servicePatterns) {
    if (re.test(t)) return { serviceMatchScore: 1, matchedService: svc };
  }
  return { serviceMatchScore: 0, matchedService: "" };
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function searchReddit(kw: string) {
  const query = `site:reddit.com ${kw} -"for hire" -"forhire" -"hiring me" -"hire me" -"available for" -"open to work" -"looking for work" -"seeking"`;
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": process.env.SERPER_API_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify({ q: query, tbs: "qdr:w" }),
  });
  const data = await res.json();
  return (data.organic || []).filter((r: any) => /reddit\.com\/r\/[^/]+\/comments\//.test(r.link));
}

async function main() {
  console.log("Fetching keyword pool...");
  const [wl] = await sql`SELECT keywords FROM watchlists WHERE agency_id = ${AGENCY_ID} LIMIT 1`;
  if (!wl) { console.log("No watchlist"); return; }
  const pool = (wl.keywords as string[]) || [];

  // Pick random subset
  const keywords = shuffle(pool).slice(0, KEYWORDS_PER_SWEEP);
  console.log(`Rotating pool: ${pool.length} keywords, picked ${keywords.length} for this sweep`);
  console.log("Picked:", keywords.map((k: string) => `"${k}"`).join(", "));

  // Collect IDs of newly inserted leads
  const newLeadIds: string[] = [];

  for (const [i, kw] of keywords.entries()) {
    await sleep(600);
    console.log(`\n[${i + 1}/${keywords.length}] "${kw}"`);
    
    let posts: any[];
    try {
      posts = await searchReddit(kw);
    } catch (e: any) {
      console.log(`  Search failed: ${e.message}`);
      continue;
    }
    console.log(`  Found ${posts.length} posts`);

    for (const post of posts) {
      const [existing] = await sql`SELECT id FROM leads WHERE agency_id = ${AGENCY_ID} AND source_post_url = ${post.link}`;
      if (existing) continue;

      const intentScore = scoreIntent(post.title, post.snippet || "");
      if (intentScore < MIN_INTENT_SCORE) {
        continue; // silent skip for low-scoring
      }

      const { serviceMatchScore, matchedService } = scoreServiceMatch(post.title, post.snippet || "");
      const temperature = intentScore >= 0.65 ? "hot" : intentScore >= 0.4 ? "warm" : "cold";

      const subMatch = post.link.match(/reddit\.com\/r\/([^/]+)/);
      try {
        const [inserted] = await sql`INSERT INTO leads ${sql({
          agency_id: AGENCY_ID,
          source: "reddit",
          source_post_url: post.link,
          title: post.title,
          snippet: post.snippet || "",
          subreddit: subMatch?.[1] || null,
          posted_at: post.date ? new Date(post.date) : null,
          intent_score: intentScore,
          service_match_score: serviceMatchScore,
          temperature,
          status: "new",
        })} RETURNING id`;
        newLeadIds.push(inserted.id);
        const icon = temperature === "hot" ? "🔥" : temperature === "warm" ? "🟡" : "⚪";
        console.log(`  ${icon} [${temperature}] ${post.title.substring(0, 65)} (${Math.round(intentScore * 100)}%/${Math.round(serviceMatchScore * 100)}%)`);
      } catch (e: any) {
        console.log(`  ❌ DB Error: ${e.message?.substring(0, 100)}`);
      }
    }
  }

  console.log(`\n📊 RESULTS: ${newLeadIds.length} new leads`);

  if (newLeadIds.length > 0) {
    const newLeads = await sql`SELECT title, subreddit, intent_score, service_match_score, temperature, source_post_url FROM leads WHERE id = ANY(${newLeadIds}) ORDER BY intent_score DESC`;
    if (newLeads.length > 0) {
      console.log(`\n📋 TOP LEADS:`);
      for (const l of newLeads) {
        const icon = l.temperature === "hot" ? "🔥" : l.temperature === "warm" ? "🟡" : "⚪";
        console.log(`  ${icon} r/${l.subreddit} | ${(l.title || "").substring(0, 65)}`);
        console.log(`     ${Math.round(l.intent_score * 100)}%/${Math.round(l.service_match_score * 100)}%`);
        console.log(`     ${l.source_post_url}`);
      }
    }
  }

  await sql.end();
}

main().catch(e => { console.error(e); process.exit(1); });
