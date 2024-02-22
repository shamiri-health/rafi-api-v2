import { Static, Type } from "@sinclair/typebox";
import { FastifyPluginAsync } from "fastify";
import { user } from "../../database/schema";
import { eq } from "drizzle-orm";
import { UserResponse } from "../../lib/schemas";
import { hash } from "@node-rs/bcrypt";

const ProfileUpdateRequest = Type.Object({
  alias: Type.Optional(Type.String()),
  avatarId: Type.Optional(Type.Number()), // TODO: snake_case this
  avatar_id: Type.Optional(Type.Number()),
});

const ChangePinQueryString = Type.Object({
  pin: Type.String({ maxLength: 4, minLength: 4 }),
});

const ChangePinRequestBody = Type.Optional(ChangePinQueryString);

type ProfileUpdateRequest = Static<typeof ProfileUpdateRequest>;
type ChangePinRequest = Static<typeof ChangePinQueryString>;
type ChangePinRequestBody = Static<typeof ChangePinRequestBody>;

const accountRouter: FastifyPluginAsync = async (fastify): Promise<void> => {
  // @ts-ignore
  fastify.addHook("onRequest", fastify.authenticate);

  fastify.put<{ Body: ProfileUpdateRequest }>(
    "/profile",
    {
      schema: {
        body: ProfileUpdateRequest,
        response: {
          200: UserResponse,
        },
      },
    },
    async (request) => {
      const { alias, avatarId } = request.body;

      let payload: Partial<typeof user.$inferInsert> = {};

      if (alias) {
        const aliasTaken = await fastify.db.query.user.findFirst({
          where: eq(user.alias, alias),
        });

        if (aliasTaken) {
          throw fastify.httpErrors.badRequest(
            "Alias is already taken, please enter a different one",
          );
        }
        payload.alias = alias;
      }

      if (avatarId) {
        payload.avatarId = avatarId;
      }

      // TODO: FETCH THIS FROM JWT TOKEN
      const [updatedUser] = await fastify.db
        .update(user)
        .set(payload)
        // @ts-ignore
        .where(eq(user.id, request.user.sub))
        .returning();

      return updatedUser;
    },
  );

  fastify.put<{ Querystring: ChangePinRequest; Body: ChangePinRequestBody }>(
    "/changePin",
    {
      schema: {
        querystring: ChangePinQueryString,
        body: ChangePinRequestBody,
      },
    },
    async (request) => {
      // @ts-ignore
      const id = request.user.sub;
      const pin = request.query.pin ?? request.body.pin;
      const newPin = await hash(pin);
      const pinBuffer = Buffer.from(newPin);

      const [updatedUser] = await fastify.db
        .update(user)
        .set({ pinH: pinBuffer })
        .where(eq(user.id, id))
        .returning();
      return updatedUser;
    },
  );
};

export default accountRouter;
