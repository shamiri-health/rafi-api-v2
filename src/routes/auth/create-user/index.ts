import { FastifyPluginAsync } from "fastify";
import { Type, Static } from "@sinclair/typebox";
import { eq, or } from "drizzle-orm";
import { human } from "../../../database/schema";
import { sendVerificationCode } from "../../../lib/auth";
import { addUserToStream } from "../../../lib/stream";
import { UserResponse } from "../../../lib/schemas";
import { createUser } from "../../../services/userService";

const CreateUserBody = Type.Object({
  email: Type.String(), // FIXME: tighten this to use 'email format'
  phone_number: Type.String(),
  birth_date: Type.Optional(Type.String()), // FIXME: tighten this to use the 'date format'
  gender: Type.Optional(
    Type.Union([
      Type.Literal("MALE"),
      Type.Literal("FEMALE"),
      Type.Literal("PREFER NOT TO SAY"),
    ]),
  ),
  education_level: Type.Union([
    Type.Literal("Primary School"),
    Type.Literal("High School"),
    Type.Literal("College"),
    Type.Literal("Graduate"),
  ]),
  referral_code: Type.Optional(Type.String()),
  profession: Type.Union([
    Type.Literal("Computer and Mathematical"),
    Type.Literal("Architecture and Engineering"),
    Type.Literal("Legal"),
    Type.Literal("Education, Training, and Library"),
    Type.Literal("Business and Financial Operations"),
    Type.Literal("Healthcare Practitioners"),
    Type.Literal("Food Preparation and Serving"),
    Type.Literal("Installation, Maintenance, and Repair"),
    Type.Literal("Arts, Design, Entertainment, Sports, and Media"),
    Type.Literal("Community and Social Service"),
    Type.Literal("Building and Grounds Cleaning and Maintenance"),
    Type.Literal("Construction and Extraction"),
    Type.Literal("Production"),
    Type.Literal("Personal Care and Service"),
    Type.Literal("Office and Administrative Support"),
    Type.Literal("Protective Service"),
    Type.Literal("Farming, Fishing, and Forestry"),
    Type.Literal("Life, Physical, and Social Science"),
    Type.Literal("Healthcare Support"),
    Type.Literal("Management"),
    Type.Literal("Sales and Related"),
    Type.Literal("Transportation and Materials Moving"),
  ]),
});

type CreateUserBody = Static<typeof CreateUserBody>;

const createUserRoute: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post<{ Body: CreateUserBody }>(
    "/",
    {
      schema: {
        body: CreateUserBody,
        response: {
          201: UserResponse,
        },
      },
    },
    async (request, reply) => {
      const phoneNumber = request.body.phone_number.trim().toLowerCase();
      const email = request.body.email.trim().toLowerCase();

      const existingUser = await fastify.db.query.human.findFirst({
        where: or(eq(human.mobile, phoneNumber), eq(human.email, email)),
      });

      if (existingUser) {
        const error = existingUser.email === email ? "email" : "phone";
        throw fastify.httpErrors.badRequest(
          `A user exists with the supplied ${error}`,
        );
      }

      const userResult = await createUser(fastify.db, request.body);

      if (userResult) {
        try {
          await sendVerificationCode(phoneNumber, "sms");

          // FIXME: might be better to use getOrCreate method here
          // if we get a user client then we have to scrub that record.
          const t = await addUserToStream(
            userResult.id.toString(),
            userResult?.name ?? `anonymous_${userResult.id}`,
            phoneNumber,
          );
          fastify.log.info(`Response from t: ${t}`);
        } catch (e) {
          fastify.log.warn(e);
        }
      }

      return reply.code(201).send(userResult);
    },
  );
};

export default createUserRoute;
