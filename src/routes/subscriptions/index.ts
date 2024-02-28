import { FastifyPluginAsync } from "fastify";

const subscriptionsRouter: FastifyPluginAsync = async (
  fastify,
  _,
): Promise<void> => {
  fastify.post("/digital-event", async (request) => {});
};
