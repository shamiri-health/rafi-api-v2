import type { Config } from "drizzle-kit";
export default {
  schema: "./src/database/schema.ts",
  out: "./src/database",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL ?? "",
  },
} satisfies Config;
