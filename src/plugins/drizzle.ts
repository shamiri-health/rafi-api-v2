import fp from "fastify-plugin";
import { generateDbClient } from "../lib/db";
import type { database } from "../lib/db";

const { db, queryClient } = generateDbClient();
export default fp(async (fastify) => {
  try {
    if (!fastify.db) {
      fastify.decorate("db", db);

      fastify.addHook("onClose", (_, done) => {
        queryClient.end();
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
