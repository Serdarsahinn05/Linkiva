import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

// Prisma 7 no longer loads .env on its own. Node 22 can, without a dotenv dependency.
// .env.local first so local overrides win (loadEnvFile does not overwrite existing keys).
for (const file of [".env.local", ".env"]) if (existsSync(file)) process.loadEnvFile(file);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Migrations need a direct (non-pooled) connection; the app uses DATABASE_URL via the pg adapter.
  datasource: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "" },
});
