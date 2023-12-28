import { FastifyPluginAsync } from "fastify";
import { blacklistToken } from "../../schema";
import { eq } from "drizzle-orm";

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
    if (request.headers["authorization"]) {
      try {
        const token = request.headers.authorization.split(" ")[1].trim();
        console.log("Token: ", token);
        await fastify.db
          .insert(blacklistToken)
          .values({ token, blacklistedOn: new Date().toISOString() });
        console.log(
          await fastify.db
            .select()
            .from(blacklistToken)
            .where(eq(blacklistToken.token, token)),
        );
        return { message: "sucessfully logged out user" };
      } catch (e) {
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
