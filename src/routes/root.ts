import { FastifyPluginAsync } from "fastify";

const root: FastifyPluginAsync = async (fastify, _): Promise<void> => {
  fastify.get("/", async function (request, _) {
    return { root: true };
  });
};

export default root;
