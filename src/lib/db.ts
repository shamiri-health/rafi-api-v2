import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../database/schema";
import postgres from "postgres";

export function generateDbClient() {
  const queryClient = postgres(process.env.DATABASE_URL ?? "");
  const db = drizzle(queryClient, { schema });
  return {
    queryClient,
    db,
  };
}

export type database = ReturnType<typeof generateDbClient>;
