import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/prisma/generated/client";
import { env } from "@/lib/env";

const createClient = () => new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL }) });

// Reuse one client across hot reloads in development.
const globalForDb = globalThis as unknown as { db?: ReturnType<typeof createClient> };

export const db = globalForDb.db ?? createClient();

if (env.NODE_ENV !== "production") globalForDb.db = db;
