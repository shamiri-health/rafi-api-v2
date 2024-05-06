import { FastifyPluginAsync } from "fastify";

const subscriptionsRouters: FastifyPluginAsync = async (
  fastify,
): Promise<void> => {
  // allow an authenticated user to view their subscription
  // @ts-ignore
  fastify.get("/", { onRequest: fastify.authenticate }, async (req) => {
    // @ts-ignore
    const userId = req.user.sub;

    // process the subscription request here

    return userId;
  });
};

export default subscriptionsRouters;
