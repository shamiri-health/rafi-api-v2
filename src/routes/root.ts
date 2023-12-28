import { FastifyPluginAsync } from "fastify";
import { user } from "../schema";

const root: FastifyPluginAsync = async (fastify, _): Promise<void> => {
  fastify.get("/", async function (request, _) {
    fastify.log.info(fastify.db);
    const t = await fastify.db.select().from(user);
    fastify.log.info(t);
    return { root: true };
  });
};

export default root;
