import { FastifyPluginAsync } from "fastify";
import { blacklistToken } from "../../schema";
import { Type, Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { parsePhoneNumber } from "libphonenumber-js";
import { sendVerificationCode, checkVerificationCode } from "../../lib/auth";

export const ForgotPinResponse = Type.Object({
  username: Type.String(),
});

export type ForgotPinResponseType = Static<typeof ForgotPinResponse>;

const authRouther: FastifyPluginAsync = async (fastify, _): Promise<void> => {
  fastify.post("/verify", async () => {});

  fastify.post("/token", async () => {});

  fastify.post("/create-user", async () => {});

  fastify.post("/forgotPin", async (_, response) => {
    response.redirect(302, "/forgot-pin");
  });

  fastify.post<{ Body: ForgotPinResponseType }>(
    "/forgot-pin",
    {
      schema: {
        body: Type.Object({
          username: Type.String(),
        }),
      },
    },
    async (request, _) => {
      const { username } = request.body;

      if (Value.Check(Type.String({ format: "email" }), username)) {
        await sendVerificationCode(username, "email");
        return { message: "successfuly sent code via email" };
      } else if (parsePhoneNumber(username, "KE")) {
        sendVerificationCode(username, "sms");
        return { message: "successfuly sent code via sms" };
      } else {
        throw fastify.httpErrors.badRequest(
          "Please provided a valid email or a valid Kenyan Phonenumber",
        );
      }
    },
  );

  fastify.post(
    "/logout",
    {
      schema: {
        response: {
          200: Type.Object({ message: Type.String() }),
        },
      },
    },
    async (request, _) => {
      const authorizationHeader = (request.headers.authorization ||
        request.headers.Authorization) as string;
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

          return { message: "successfully logged out user" };
        } catch (e) {
          fastify.log.error(e);
          throw fastify.httpErrors.badRequest(
            "Unable to parse token, please provide a valid header in the form of Bearer <Token>",
          );
        }
      }
      throw fastify.httpErrors.badRequest(
        "Cannot logout a user without a valid Authorization",
      );
    },
  );
};

export default authRouther;
