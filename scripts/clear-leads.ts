import { config } from 'dotenv';
config({ path: '.env.local' });
import postgres from 'postgres';

async function main() {
  const sql = postgres(process.env.DATABASE_URL!);
  const del = await sql`DELETE FROM leads WHERE agency_id = '324f5968-2521-4e2e-aea0-159f120b2bec'`;
  console.log(`Deleted ${del.count} old leads`);
  await sql.end();
}
main();
