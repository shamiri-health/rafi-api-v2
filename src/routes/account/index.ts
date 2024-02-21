import { Static, Type } from "@sinclair/typebox";
import { FastifyPluginAsync } from "fastify";
import { user } from "../../database/schema";
import { eq } from "drizzle-orm";

const ProfileUpdateRequest = Type.Object({
  alias: Type.Optional(Type.String()),
  avatarId: Type.Optional(Type.Number()), // TODO: snake_case this
})

type ProfileUpdateRequest = Static<typeof ProfileUpdateRequest>

const accountRouter: FastifyPluginAsync = async (fastify, _): Promise<void> => {
  fastify.put<{ Body: ProfileUpdateRequest }>("/profile", { schema: { body: ProfileUpdateRequest } }, async (request) => {
    const { alias, avatarId } = request.body;

    let payload: Partial<typeof user.$inferInsert> = {};

    if (alias) {
      payload.alias = alias;
    }

    if (avatarId) {
      payload.avatarId = avatarId;
    }

    // TODO: FETCH THIS FROM JWT TOKEN
    await fastify.db.update(user).set(payload).where(eq(user.id, 1))
  });
}

export default accountRouter;
