import { Static, Type } from "@sinclair/typebox";
import { FastifyPluginAsync } from "fastify";
import { user } from "../../database/schema";
import { eq } from "drizzle-orm";
import { UserResponse } from "../../lib/schemas";

const ProfileUpdateRequest = Type.Object({
  alias: Type.Optional(Type.String()),
  avatarId: Type.Optional(Type.Number()), // TODO: snake_case this
  avatar_id: Type.Optional(Type.Number()),
});

type ProfileUpdateRequest = Static<typeof ProfileUpdateRequest>;

const accountRouter: FastifyPluginAsync = async (fastify, _): Promise<void> => {
  fastify.put<{ Body: ProfileUpdateRequest }>(
    "/profile",
    {
      // @ts-ignore
      onRequest: [fastify.authenticate],
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
};

export default accountRouter;
