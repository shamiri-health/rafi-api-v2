import { Static, Type } from "@sinclair/typebox";
import { FastifyPluginAsync } from "fastify";
import { therapist, user, userService } from "../../database/schema";
import { and, eq } from "drizzle-orm";
import { UserResponse } from "../../lib/schemas";
// import { hash } from "@node-rs/bcrypt";

const ProfileUpdateRequest = Type.Object({
  alias: Type.Optional(Type.String()),
  avatarId: Type.Optional(Type.Number()), // TODO: snake_case this
  avatar_id: Type.Optional(Type.Number()),
});

// const ChangePinQueryString = Type.Object({
//   pin: Type.String({ maxLength: 4, minLength: 4 }),
// });

type ProfileUpdateRequest = Static<typeof ProfileUpdateRequest>;
// type ChangePinRequest = Static<typeof ChangePinQueryString>;

const accountRouter: FastifyPluginAsync = async (fastify): Promise<void> => {
  // @ts-ignore
  fastify.addHook("onRequest", fastify.authenticate);

  fastify.get("/profile", async (request) => {
    const userProfile = await fastify.db.query.user.findFirst({
      // @ts-ignore
      where: eq(user.id, parseInt(request.user.sub)),
    });

    if (!userProfile) {
      throw fastify.httpErrors.notFound(
        "User associated with the security token not found. Kindly contact support",
      );
    }

    const assignedTherapist = await fastify.db
      .select()
      .from(therapist)
      .innerJoin(
        userService,
        and(
          // @ts-ignore
          eq(userService.userId, request.user.sub),
          eq(userService.assignedTherapistId, therapist.id),
        ),
      );

    return {
      ...userProfile,
      assignedTherapist: assignedTherapist[0]?.therapist,
    };
  });

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
      const { alias } = request.body;
      const avatarId = request.body.avatarId ?? request.body.avatar_id;

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

      const [updatedUser] = await fastify.db
        .update(user)
        .set(payload)
        // @ts-ignore
        .where(eq(user.id, request.user.sub))
        .returning();

      return updatedUser;
    },
  );

  /* TODO: uncomment when frontend starts sending the pin in the request body instead of querystring
  fastify.put<{ Querystring: ChangePinRequest }>(
    "/changePin",
    {
      schema: {
        querystring: ChangePinQueryString,
      },
    },
    async (request) => {
      // @ts-ignore
      const id = request.user.sub;
      const newPin = await hash(request.query.pin);
      const pinBuffer = Buffer.from(newPin);

      const [updatedUser] = await fastify.db
        .update(user)
        .set({ pinH: pinBuffer })
        .where(eq(user.id, id))
        .returning();
      return updatedUser;
    },
  );
  */
};

export default accountRouter;
