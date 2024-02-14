import fp from "fastify-plugin";

export default fp(async (fastify) => {
  // @ts-ignore
  fastify.decorate("authenticate", async function (request, _reply) {
    try {
      await request.jwtVerify();
      // TODO: fetch the user data from the db and append it to the request
    } catch (err) {
      fastify.log.warn("JWT TOKEN verification attempted with invalid token");
      fastify.log.warn(err);
      // do some checking of possible errors
    }
  });
});
// TODO: make sure that we mark the dependency on the database object
