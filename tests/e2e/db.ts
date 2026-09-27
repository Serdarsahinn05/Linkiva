import nextEnv from "@next/env";
import { Client } from "pg";

// CommonJS package: its named exports are only on the default import under ESM.
nextEnv.loadEnvConfig(process.cwd());

/**
 * Direct SQL against the local test database, for set-up the UI cannot do in a test (a custom domain that Vercel
 * has verified). Same database the web server uses (.env.local).
 */
export async function sql(text: string, values: unknown[] = []) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    return (await client.query(text, values)).rows;
  } finally {
    await client.end();
  }
}
