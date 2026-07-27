import { config } from 'dotenv';
config({ path: '.env.local' });
import postgres from 'postgres';
const AGENCY_ID = '324f5968-2521-4e2e-aea0-159f120b2bec';

async function main() {
  const sql = postgres(process.env.DATABASE_URL!);
  const byStatus = await sql`SELECT status, count(*)::int as cnt FROM leads WHERE agency_id = ${AGENCY_ID} GROUP BY status`;
  console.log('By status:', JSON.stringify(byStatus));
  
  const newest = await sql`SELECT title, subreddit, status, surfaced_at FROM leads WHERE agency_id = ${AGENCY_ID} ORDER BY surfaced_at DESC LIMIT 5`;
  console.log('Latest 5 leads:', JSON.stringify(newest, null, 2));
  
  await sql.end();
}
main();
