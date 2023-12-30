import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// TODO: have this come from zod schema
export const queryClient = postgres(process.env.DATABASE_URL ?? "");
export const db = drizzle(queryClient);
