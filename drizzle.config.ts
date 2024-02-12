import type { Config } from "drizzle-kit";
import envConfig from './config'

export default {
  schema: "./src/schema.ts",
  out: "./src/database",
  driver: "pg",
  dbCredentials: {
    connectionString: envConfig.DATABASE_URL
  },
} satisfies Config;
