import { existsSync } from "node:fs";

// Integration tests talk to the local docker database (docker compose up -d).
for (const file of [".env.local", ".env"]) if (existsSync(file)) process.loadEnvFile(file);
