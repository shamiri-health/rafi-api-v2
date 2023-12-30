import { FastifyPluginAsync } from "fastify";
import { blacklistToken, human } from "../../schema";
import { Type, Static } from "@sinclair/typebox";
import { isValidPhoneNumber } from "libphonenumber-js";
import { sendVerificationCode } from "../../lib/auth";
import { z } from "zod";
import { eq, or } from "drizzle-orm";

// TODO: harden validation here
export const VerifyTokenBody = Type.Object({
  phone_number: Type.Optional(Type.String()),
  phoneNumber: Type.Optional(Type.String()),
  email: Type.Optional(Type.String()),
  channel: Type.Union([Type.Literal("sms"), Type.Literal("email")]),
});

export type VerifyTokenBody = Static<typeof VerifyTokenBody>;

export const ForgotPinResponse = Type.Object({
  username: Type.String(),
});

export type ForgotPinResponseType = Static<typeof ForgotPinResponse>;

const authRouther: FastifyPluginAsync = async (fastify, _): Promise<void> => {
  fastify.post<{ Body: VerifyTokenBody }>("/verify", async (request) => {
    const { phoneNumber, phone_number, email, channel } = request.body;

    if (!phoneNumber || (!phone_number && channel === "sms")) {
      throw fastify.httpErrors.badRequest(
        "You need to specify either phone_number or phoneNumber if the specified channel is sms",
      );
    }

    if (!email && channel === "email") {
      throw fastify.httpErrors.badRequest("You need to specify eithe");
    }

    // TODO: deprecate this once we use the correct key i.e. phone_number
    const phoneValue = phoneNumber ?? phone_number;
    const result = await fastify.db
      .select()
      .from(human)
      .where(or(eq(human.email, email), eq(human.mobile, phoneValue)));

    if (!result.length) {
      throw fastify.httpErrors.notFound(
        "Could not find a user with the specified email",
      );
    }

    try {
      if (channel === "sms") {
        await sendVerificationCode(phoneValue, "sms");
      } else {
        await sendVerificationCode(phoneValue, "email");
      }
      return { message: "Verification token sent successfully" };
    } catch (e) {
      fastify.log.error(e);
      throw fastify.httpErrors.internalServerError(
        "Sorry could not process request. Please contact software support",
      );
    }
  });

  fastify.post("/token", async () => {});

  fastify.post("/create-user", async () => {});

  fastify.post(
    "/forgotPin",
    { schema: { deprecated: true } },
    async (_, response) => {
      response.redirect(302, "/forgot-pin");
    },
  );

  fastify.post<{ Body: ForgotPinResponseType }>(
    "/forgot-pin",
    {
      schema: {
        body: Type.Object({
          username: Type.String(),
        }),
        response: {
          200: Type.Object({
            message: Type.String(),
          }),
        },
      },
    },
    async (request, _) => {
      const { username } = request.body;

      const emailSchema = z.string().email();
      const result1 = emailSchema.safeParse(username);

      if (result1.success) {
        await sendVerificationCode(username, "email");
        return { message: "successfuly sent code via email" };
      }

      if (isValidPhoneNumber(username, "KE")) {
        await sendVerificationCode(username, "sms");
        return { message: "successfuly sent code via sms" };
      }

      throw fastify.httpErrors.badRequest(
        "Please provide a valid email or a valid Kenyan Phonenumber",
      );
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
