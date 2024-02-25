import fp from "fastify-plugin";
import { generateDbClient } from "../lib/db";
import type { database } from "../lib/db";

export default fp(async (fastify) => {
  try {
    if (!fastify.db) {
      const { db, queryClient } = generateDbClient();

      fastify.decorate("db", db);

      fastify.addHook("onClose", (_, done) => {
        queryClient.end({ timeout: 5 });
        done();
      });
    }
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
    db: database["db"];
  }
}
