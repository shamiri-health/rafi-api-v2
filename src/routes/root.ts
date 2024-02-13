import { FastifyPluginAsync } from "fastify";

const root: FastifyPluginAsync = async (fastify, _): Promise<void> => {
  fastify.get("/", function (_, reply) {
    reply.send({ root: true });
  });

  fastify.get("/health", function (_, reply) {
    reply.send("Healthy and functioning");
  });
};

export default root;
