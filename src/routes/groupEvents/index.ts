import { Static, Type } from "@sinclair/typebox";
import { FastifyPluginAsync } from "fastify";
import {
  groupEvent,
  groupSession,
  groupTopic,
  human,
  therapist,
  therapySession,
} from "../../database/schema";
import { and, eq, gte, isNotNull, isNull, lt, or, sql } from "drizzle-orm";

const Therapist = Type.Object({
  id: Type.Integer(),
  gender: Type.Optional(Type.String()),
  photoUrl: Type.String(),
  name: Type.String(),
  about: Type.String(),
  summary: Type.String(),
});

const GroupTopic = Type.Object({
  id: Type.Integer(),
  name: Type.String(),
  about: Type.String(),
  summary: Type.String(),
});

const GroupSession = Type.Object({
  id: Type.Number(),
  therapist: Therapist,
  groupTopic: GroupTopic,
  startTime: Type.String({ format: "date-time" }),
  endTime: Type.String({ format: "date-time" }),
  capacity: Type.Number(),
});

const GroupEvent = Type.Object({
  id: Type.String(),
  recommendDatetime: Type.String({ format: "date-time" }),
  enrollDatetime: Type.String({ format: "date-time" }),
  completeDatetime: Type.String({ format: "date-time" }),
  groupSession: GroupSession,
  groupTopic: GroupTopic,
  assetUrl: Type.Optional(Type.String()),
  backgroundColor: Type.Optional(Type.String()),
  buttonColor: Type.Optional(Type.String()),
  credit: Type.Optional(Type.Number()),
  type: Type.Optional(Type.String()),
});

const GroupEventCreate = Type.Object({
  groupSessionId: Type.Number(),
  relatedDomains: Type.Optional(Type.Array(Type.String())),
  groupTopicId: Type.Number(),
  eventId: Type.Optional(Type.String()),
});

const GroupEventUpdate = Type.Object({
  groupSessionId: Type.Number(),
});

const GroupEventParams = Type.Object({
  groupEventId: Type.String(),
});

type GroupEvent = Static<typeof GroupEvent>;
type GroupEventCreate = Static<typeof GroupEventCreate>;
type GroupEventUpdate = Static<typeof GroupEventUpdate>;
type GroupEventParams = Static<typeof GroupEventParams>;

const groupEvents: FastifyPluginAsync = async (fastify, _): Promise<void> => {
  // @ts-ignore
  fastify.addHook("onRequest", fastify.authenticate);

  fastify.post<{ Body: GroupEventCreate }>("/", {}, async (request) => {});

  fastify.get(
    "/",
    {
      schema: {
        response: {
          200: Type.Array(GroupEvent),
        },
      },
    },
    async (request) => {
      // @ts-ignore
      const userId = request.user.sub;

      const groupSessions = await fastify.db
        .select({
          id: therapySession.id,
          recommendDatetime: therapySession.recommendDatetime,
          completeDatetime: therapySession.completeDatetime,
          enrollDatetime: therapySession.enrollDatetime,
          groupSession: {
            ...groupSession,
            groupTopic: groupTopic,
            therapist: { ...therapist, name: human.name },
          },
          groupTopic: groupTopic,
        })
        .from(therapySession)
        .innerJoin(groupEvent, eq(groupEvent.id, therapySession.id))
        .innerJoin(groupSession, eq(groupSession.id, groupEvent.groupSessionId))
        .innerJoin(groupTopic, eq(groupTopic.id, groupEvent.groupTopicId))
        .innerJoin(therapist, eq(groupSession.therapistId, therapist.id))
        .innerJoin(human, eq(human.id, therapist.id))
        .where(eq(therapySession.userId, userId));

      return groupSessions;
    },
  );

  fastify.get(
    "/recommended",
    {
      schema: {
        response: {
          200: Type.Array(GroupEvent),
        },
      },
    },
    async (request) => {
      // @ts-ignore
      const userId = request.user.sub;

      const recommendedSessions = await fastify.db
        .select({
          id: therapySession.id,
          recommendDatetime: therapySession.recommendDatetime,
          completeDatetime: therapySession.completeDatetime,
          enrollDatetime: therapySession.enrollDatetime,
          groupSession: {
            ...groupSession,
            groupTopic: groupTopic,
            therapist: { ...therapist, name: human.name },
          },
          groupTopic: groupTopic,
        })
        .from(therapySession)
        .innerJoin(groupEvent, eq(groupEvent.id, therapySession.id))
        .innerJoin(groupSession, eq(groupSession.id, groupEvent.groupSessionId))
        .innerJoin(groupTopic, eq(groupTopic.id, groupEvent.groupTopicId))
        .innerJoin(therapist, eq(groupSession.therapistId, therapist.id))
        .innerJoin(human, eq(human.id, therapist.id))
        .where(
          and(
            isNull(therapySession.completeDatetime),
            isNull(therapySession.enrollDatetime),
            isNull(groupEvent.groupSessionId),
            isNotNull(therapySession.recommendDatetime),
            eq(therapySession.userId, userId),
          ),
        );

      // format the response
      return recommendedSessions;
    },
  );

  fastify.get(
    "/enrolled",
    {
      schema: {
        response: {
          200: Type.Array(GroupEvent),
        },
      },
    },
    async (request) => {
      // @ts-ignore
      const userId = request.user.sub;
      const enrolledSessions = await fastify.db
        .select({
          id: therapySession.id,
          recommendDatetime: therapySession.recommendDatetime,
          completeDatetime: therapySession.completeDatetime,
          enrollDatetime: therapySession.enrollDatetime,
          groupSession: {
            ...groupSession,
            groupTopic: groupTopic,
            therapist: { ...therapist, name: human.name },
          },
          groupTopic: groupTopic,
        })
        .from(therapySession)
        .innerJoin(groupEvent, eq(groupEvent.id, therapySession.id))
        .innerJoin(groupSession, eq(groupSession.id, groupEvent.groupSessionId))
        .innerJoin(groupTopic, eq(groupTopic.id, groupEvent.groupTopicId))
        .innerJoin(therapist, eq(groupSession.therapistId, therapist.id))
        .innerJoin(human, eq(human.id, therapist.id))
        .where(
          and(
            isNull(therapySession.completeDatetime),
            gte(sql`DATE(${groupSession.startTime})`, sql`DATE(NOW())`),
            eq(therapySession.userId, userId),
          ),
        );
      // format the response
      return enrolledSessions;
    },
  );

  fastify.get(
    "/archived",
    {
      schema: {
        response: {
          200: Type.Array(GroupEvent),
        },
      },
    },
    async (request) => {
      // @ts-ignore
      const userId = request.user.sub;
      const archivedSessions = await fastify.db
        .select({
          id: therapySession.id,
          recommendDatetime: therapySession.recommendDatetime,
          completeDatetime: therapySession.completeDatetime,
          enrollDatetime: therapySession.enrollDatetime,
          groupSession: {
            ...groupSession,
            groupTopic: groupTopic,
            therapist: { ...therapist, name: human.name },
          },
          groupTopic: groupTopic,
        })
        .from(therapySession)
        .innerJoin(groupEvent, eq(groupEvent.id, therapySession.id))
        .innerJoin(groupSession, eq(groupSession.id, groupEvent.groupSessionId))
        .innerJoin(groupTopic, eq(groupTopic.id, groupEvent.groupTopicId))
        .innerJoin(therapist, eq(groupSession.therapistId, therapist.id))
        .innerJoin(human, eq(human.id, therapist.id))
        .where(
          and(
            eq(therapySession.userId, userId),
            isNotNull(therapySession.enrollDatetime),
            or(
              lt(
                sql`DATE(${therapySession.completeDatetime})`,
                sql`DATE(NOW())`,
              ),
            ),
          ),
        );
      // format the response
      return archivedSessions;
    },
  );

  fastify.get<{ Params: GroupEventParams }>(
    "/:groupEventId",
    {
      schema: {
        params: GroupEventParams,
        response: {
          // 200: GroupEvent,
        },
      },
    },
    async (request) => {
      const { groupEventId } = request.params;
      // @ts-ignore
      const userId = request.user.sub;

      const [foundGroupSession] = await fastify.db
        .select({
          id: therapySession.id,
          recommendDatetime: therapySession.recommendDatetime,
          completeDatetime: therapySession.completeDatetime,
          enrollDatetime: therapySession.enrollDatetime,
          groupSession: {
            ...groupSession,
            groupTopic: groupTopic,
            therapist: { ...therapist, name: human.name },
          },
          groupTopic: groupTopic,
        })
        .from(therapySession)
        .innerJoin(groupEvent, eq(groupEvent.id, therapySession.id))
        .innerJoin(groupSession, eq(groupSession.id, groupEvent.groupSessionId))
        .innerJoin(groupTopic, eq(groupTopic.id, groupEvent.groupTopicId))
        .innerJoin(therapist, eq(groupSession.therapistId, therapist.id))
        .innerJoin(human, eq(human.id, therapist.id))
        .where(
          and(
            eq(therapySession.userId, userId),
            eq(therapySession.id, groupEventId),
            eq(therapySession.type, "groupEvent"),
          ),
        );

      if (!foundGroupSession) {
        throw fastify.httpErrors.notFound(
          `Therapy session with the id of ${groupEventId} not found.`,
        );
      }

      return foundGroupSession;
    },
  );

  fastify.put<{ Params: GroupEventParams; Body: GroupEventUpdate }>(
    "/:groupEventId",
    {
      schema: {
        body: GroupEventUpdate,
        params: GroupEventParams,
        response: {
          200: GroupEvent,
        },
      },
    },
    async (request) => {
      const { groupEventId } = request.params;
      // @ts-ignore
      const userId = request.user.sub;
      const [updatedGroupEvent] = await fastify.db
        .update(groupEvent)
        .set({
          groupSessionId: request.body.groupSessionId,
        })
        .where(eq(groupEvent.id, groupEventId));

      const [foundGroupSession] = await fastify.db
        .select({
          id: therapySession.id,
          recommendDatetime: therapySession.recommendDatetime,
          completeDatetime: therapySession.completeDatetime,
          enrollDatetime: therapySession.enrollDatetime,
          groupSession: {
            ...groupSession,
            groupTopic: groupTopic,
            therapist: { ...therapist, name: human.name },
          },
          groupTopic: groupTopic,
        })
        .from(therapySession)
        .innerJoin(groupEvent, eq(groupEvent.id, therapySession.id))
        .innerJoin(groupSession, eq(groupSession.id, groupEvent.groupSessionId))
        .innerJoin(groupTopic, eq(groupTopic.id, groupEvent.groupTopicId))
        .innerJoin(therapist, eq(groupSession.therapistId, therapist.id))
        .innerJoin(human, eq(human.id, therapist.id))
        .where(
          and(
            eq(therapySession.userId, userId),
            eq(therapySession.id, groupEventId),
            eq(therapySession.type, "groupEvent"),
          ),
        );

      if (!updatedGroupEvent) {
        throw fastify.httpErrors.notFound(
          `Therapy session with the id of ${groupEventId} not found.`,
        );
      }

      return foundGroupSession;
    },
  );

  fastify.delete<{ Params: GroupEventParams }>(
    "/:groupEventId",
    {
      schema: {
        params: GroupEventParams,
      },
    },
    async (request) => {
      const { groupEventId } = request.params;
      // @ts-ignore
      const userId = request.user.sub;

      const groupSession = await fastify.db.query.therapySession.findFirst({
        where: and(
          eq(therapySession.id, groupEventId),
          eq(therapySession.userId, userId),
        ),
      });

      if (!groupSession) {
        throw fastify.httpErrors.notFound(
          `Therapy session with the id of ${groupEventId} not found.`,
        );
      }

      await fastify.db.transaction(async (trx) => {
        try {
          await trx.delete(groupEvent).where(eq(groupEvent.id, groupEventId));

          await trx
            .delete(therapySession)
            .where(
              and(
                eq(therapySession.userId, userId),
                eq(therapySession.id, groupEventId),
              ),
            );
        } catch (error) {
          await trx.rollback();
          fastify.log.error(error);
          throw error;
        }
      });

      return { message: "Session deleted successfully." };
    },
  );
};
export default groupEvents;
