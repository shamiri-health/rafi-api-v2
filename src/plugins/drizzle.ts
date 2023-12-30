import fp from "fastify-plugin";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// TODO: have this come from zod schema
const queryClient = postgres(process.env.DATABASE_URL ?? "");
const db = drizzle(queryClient);

export default fp(async (fastify) => {
  try {
    fastify.decorate("db", db);
    fastify.addHook("onClose", () => queryClient.end());
  } catch (e) {
    fastify.log.error(
      "AN ISSUE OCCURRED WITH CONNECTING TO THE DATABASE...CLOSING: ",
      e,
    );
    process.exit(1);
  }
});

declare module "fastify" {
  export interface FastifyInstance {
    db: typeof db;
  }
}
