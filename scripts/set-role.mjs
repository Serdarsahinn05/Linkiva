// Sets a user's staff role (ROADMAP Faz 19). Only for the very first admin, or to get back in if the panel locks
// everyone out; every other role change is made by an admin in the panel. Logged in admin_audit as "komut satırı".
//
//   node scripts/set-role.mjs <email> <USER|MODERATOR|ADMIN>
//
// Uses DIRECT_URL (else DATABASE_URL) from the environment, falling back to .env.local. For production, pass the
// production address on the command line (docs/private/DEPLOY.md). The host it connects to is printed first.
import { existsSync } from "node:fs";
import pg from "pg";

const [email, role] = process.argv.slice(2);
const ROLES = ["USER", "MODERATOR", "ADMIN"];

if (!email || !ROLES.includes(role)) {
  console.error("Usage: node scripts/set-role.mjs <email> <USER|MODERATOR|ADMIN>");
  process.exit(1);
}
if (!process.env.DIRECT_URL && !process.env.DATABASE_URL && existsSync(".env.local")) process.loadEnvFile(".env.local");
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error("No DIRECT_URL or DATABASE_URL.");
  process.exit(1);
}
const { hostname, pathname } = new URL(url);
console.log(`Database: ${hostname}${pathname}`);

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query("BEGIN");
  const found = await client.query(
    `SELECT u.id, u.role, p.username FROM "user" u LEFT JOIN "profile" p ON p."userId" = u.id WHERE lower(u.email) = lower($1) FOR UPDATE OF u`,
    [email.trim()],
  );
  const user = found.rows[0];
  if (!user) throw new Error("No account with that email.");
  if (user.role === role) {
    console.log(`Already ${role}; nothing changed.`);
    await client.query("ROLLBACK");
  } else {
    await client.query(`UPDATE "user" SET role = $1 WHERE id = $2`, [role, user.id]);
    await client.query(
      `INSERT INTO "admin_audit" ("actorId", "actorLabel", action, "targetType", "targetId", "targetLabel", meta) VALUES ('cli', 'komut satırı', 'roleSet', 'user', $1, $2, $3)`,
      [user.id, user.username ? `@${user.username}` : user.id, JSON.stringify({ from: user.role, to: role })],
    );
    await client.query("COMMIT");
    console.log(`${user.username ? `@${user.username}` : user.id}: ${user.role} → ${role}`);
  }
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end();
}
