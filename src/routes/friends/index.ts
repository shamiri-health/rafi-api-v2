import { and, asc, eq, isNotNull, ne, notInArray, sql } from "drizzle-orm";
import { Static, Type } from "@sinclair/typebox";
import { FastifyPluginAsync } from "fastify";
import {
  friendRequest,
  friendship,
  user,
  userAchievement,
} from "../../database/schema";

const Friend = Type.Object({
  id: Type.Number(),
  avatarId: Type.Number(),
  alias: Type.String(),
  level: Type.Optional(Type.Number()),
  streak: Type.Optional(Type.Number()),
  status: Type.Optional(Type.String()),
  action: Type.Optional(Type.String()),
});

const FriendRequestSent = Type.Object({
  targetId: Type.Number(),
  initiatorId: Type.Number(),
  target: Friend,
});

const FriendRequestReceived = Type.Object({
  targetId: Type.Number(),
  initiatorId: Type.Number(),
  initiator: Friend,
});

type Friend = Static<typeof Friend>;
type FriendRequestSent = Static<typeof FriendRequestSent>;
type FriendRequestReceived = Static<typeof FriendRequestReceived>;

const friends: FastifyPluginAsync = async (fastify, _): Promise<void> => {
  // @ts-ignore
  fastify.addHook("onRequest", fastify.authenticate);
  fastify.get(
    "/",
    {
      schema: {
        response: {
          200: Type.Array(Friend),
        },
      },
    },
    async (request, _) => {
      // @ts-ignore
      const userId = request.user.sub;
      const friends = await fastify.db
        .select({
          id: user.id,
          alias: user.alias,
          avatarId: user.avatarId,
          streak: userAchievement.streak,
          // level: userAchievement.level
        })
        .from(friendship)
        .innerJoin(user, eq(user.id, friendship.rightId))
        .leftJoin(
          userAchievement,
          eq(userAchievement.userId, friendship.rightId),
        )
        .where(eq(friendship.leftId, userId))
        .orderBy(asc(user.id));

      return friends;
    },
  );

  fastify.get(
    "/r/sent",
    {
      schema: {
        response: {
          200: Type.Array(FriendRequestSent),
        },
      },
    },
    async (request, _) => {
      // @ts-ignore
      const userId = request.user.sub;

      const friendRequests = await fastify.db
        .select({
          targetId: friendRequest.targetId,
          initiatorId: friendRequest.initiatorId,
          target: user,
        })
        .from(friendRequest)
        .innerJoin(user, eq(user.id, friendRequest.targetId))
        .where(eq(friendRequest.initiatorId, userId))
        .orderBy(asc(user.id));

      return friendRequests;
    },
  );

  fastify.get(
    "/r/received",
    {
      schema: {
        response: {
          200: Type.Array(FriendRequestReceived),
        },
      },
    },
    async (request, _) => {
      // @ts-ignore
      const userId = request.user.sub;

      const receivedRequests = await fastify.db
        .select({
          targetId: userId,
          initiatorId: user.id,
          initiator: user,
        })
        .from(friendRequest)
        .innerJoin(user, eq(user.id, friendRequest.initiatorId))
        .where(eq(friendRequest.targetId, userId))
        .orderBy(asc(user.id));

      return receivedRequests;
    },
  );

  fastify.get(
    "/suggested",
    {
      schema: {
        response: {
          200: Type.Array(Friend),
        },
      },
    },
    async (request, _) => {
      // @ts-ignore
      const userId = request.user.sub;
      const allFriends = await fastify.db
        .select()
        .from(friendship)
        .where(eq(friendship.leftId, userId));

      const friendsIds = allFriends.map((friend) => friend.rightId);

      const suggestedFriends = await fastify.db
        .select()
        .from(user)
        .where(
          and(
            ne(user.id, userId),
            isNotNull(user.alias),
            notInArray(user.id, friendsIds),
          ),
        )
        .orderBy(sql`RANDOM()`)
        .limit(3);

      return suggestedFriends;
    },
  );
};
export default friends;
