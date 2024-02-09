import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export function generateDbClient() {
  const queryClient = postgres(process.env.DATABASE_URL ?? "")
  const db = drizzle(queryClient)
  return {
    queryClient, db
  }
}

export type database = ReturnType<typeof generateDbClient>
