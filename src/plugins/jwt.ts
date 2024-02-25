import { FastifyRequest } from "fastify";
import fp from "fastify-plugin";

export default fp(async (fastify) => {
  fastify.decorate("authenticate", async function (request: FastifyRequest) {
    try {
      await request.jwtVerify();
      // TODO: check also if token is invalid
    } catch (err) {
      fastify.log.warn("JWT TOKEN verification attempted with invalid token");
      fastify.log.warn(err);
      throw err;
    }
  });
});
