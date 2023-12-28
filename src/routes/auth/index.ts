import { FastifyPluginAsync } from "fastify";
import { blacklistToken } from "../../schema";

const authRouther: FastifyPluginAsync = async (
  fastify,
  opts,
): Promise<void> => {
  fastify.post("/verify", async (request, response) => {});

  fastify.post("/token", async (request, response) => {});

  fastify.post("/create-user", async (request, response) => {});

  fastify.post("/forgotPin", async (request, response) => {
    response.redirect(302, "/forgot-pin");
  });

  fastify.post("/forgot-pin", async (request, response) => {});

  fastify.post("/logout", async (request, _) => {
    const authorizationHeader =
      request.headers.authorization ||
      (request.headers.Authorization as string);
    if (authorizationHeader) {
      try {
        const [bearer, token] = authorizationHeader.split(" ");

        if (bearer.trim() !== "Bearer") {
          throw fastify.httpErrors.badRequest("Incorrect header format");
        }

        await fastify.db.insert(blacklistToken).values({
          token: token.trim(),
          blacklistedOn: new Date().toISOString(),
        });

        return { message: "sucessfully logged out user" };
      } catch (e) {
        fastify.log.error(e);
        throw fastify.httpErrors.badRequest(
          "Unable to parse token, please provided a valid header in the form of Bearer <Token>",
        );
      }
    }
    throw fastify.httpErrors.badRequest(
      "Cannot logout a user without a valid Authorization",
    );
  });
};

export default authRouther;
