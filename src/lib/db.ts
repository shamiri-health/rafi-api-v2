import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import envConfig from "../config";

export function generateDbClient() {
  const queryClient = postgres(envConfig.DATABASE_URL ?? "");
  const db = drizzle(queryClient);
  return {
    queryClient,
    db,
  };
}

export type database = ReturnType<typeof generateDbClient>;
