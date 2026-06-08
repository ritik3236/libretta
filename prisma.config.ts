import path from "node:path";
import { defineConfig } from "prisma/config";

// A prisma.config.ts disables Prisma's automatic .env loading, so load it
// ourselves. Node 20.12+/22 ships process.loadEnvFile(); in CI/Vercel where
// there's no .env file, env vars are already in process.env — hence the catch.
try {
  process.loadEnvFile();
} catch {
  // no .env file present — rely on the ambient environment
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
