import { FastifyPluginAsync } from "fastify";

const authRouther: FastifyPluginAsync = async (
  fastify,
  opts,
): Promise<void> => {
  fastify.post("/verify", async (request, response) => {});

  fastify.post("/token", async (request, response) => {});

  fastify.post("/create-user", async (request, response) => {});

  // TODO: change to forgot-pin
  fastify.post("/forgotPin", async (request, response) => {});

  fastify.post("/logout", async (request, response) => {});
};

export default authRouther;
