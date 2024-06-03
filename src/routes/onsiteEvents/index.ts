import { Static, Type } from "@sinclair/typebox";
import { FastifyPluginAsync } from "fastify";
import { onsiteEvent, therapySession } from "../../database/schema";
import { and, eq, gte, isNotNull, isNull, sql, or, lt } from "drizzle-orm";

const OnsiteEvent = Type.Object({
  id: Type.String(),
  therapistId: Type.Number(),
  summary: Type.Optional(Type.String()),
  startTime: Type.Optional(Type.String({ format: "date-time" })),
  endTime: Type.Optional(Type.String({ format: "date-time" })),
  recommendDatetime: Type.Optional(Type.String({ format: "date-time" })),
  enrollDatetime: Type.Optional(Type.String({ format: "date-time" })),
  completeDatetime: Type.Optional(Type.String({ format: "date-time" })),
});

const OnsiteEventCreate = Type.Object({
  startTime: Type.String({ format: "date-time" }),
  endTime: Type.String({ format: "date-time" }),
  therapistId: Type.Number(),
  clinicalLevel: Type.Number(),
  eventId: Type.Optional(Type.String()),
  dataPrivacy: Type.Optional(Type.Array(Type.String())),
});

const OnsiteEventUpdate = Type.Object({
  startTime: Type.String({ format: "date-time" }),
  endTime: Type.String({ format: "date-time" }),
  dataPrivacy: Type.Optional(Type.Array(Type.String())),
  enrollDatetime: Type.Optional(Type.String({ format: "date-time" })),
  completeDatetime: Type.Optional(Type.String({ format: "date-time" })),
});

const OnsiteEventParams = Type.Object({
  onsiteEventId: Type.String(),
});

type OnsiteEvent = Static<typeof OnsiteEvent>;
type OnsiteEventCreate = Static<typeof OnsiteEventCreate>;
type OnsiteEventUpdate = Static<typeof OnsiteEventUpdate>;
type OnsiteEventParams = Static<typeof OnsiteEventParams>;

const onsiteSessions: FastifyPluginAsync = async (
  fastify,
  _,
): Promise<void> => {
  // @ts-ignore
  fastify.addHook("onRequest", fastify.authenticate);

  fastify.post<{ Body: OnsiteEventCreate }>("/", async () => {});

  fastify.get(
    "/enrolled",
    {
      schema: {
        response: {
          200: Type.Array(OnsiteEvent),
        },
      },
    },
    async (request) => {
      // @ts-ignore
      const userId = request.user.sub;
      const enrolledSessions = await fastify.db
        .select({
          id: therapySession.id,
          therapistId: onsiteEvent.therapistId,
          startTime: onsiteEvent.startTime,
          endTime: onsiteEvent.endTime,
          summary: onsiteEvent.summary,
        })
        .from(therapySession)
        .innerJoin(onsiteEvent, eq(onsiteEvent.id, therapySession.id))
        .where(
          and(
            eq(therapySession.userId, userId),
            gte(sql`DATE(${onsiteEvent.endTime})`, sql`DATE(NOW())`),
          ),
        );
      // attach the specific timezones
      return enrolledSessions;
    },
  );

  fastify.get(
    "/recommended",
    {
      schema: {
        response: {
          200: Type.Array(OnsiteEvent),
        },
      },
    },
    async (request) => {
      // @ts-ignore
      const userId = request.user.sub;
      const recommendedSessions = await fastify.db
        .select({
          id: therapySession.id,
          therapistId: onsiteEvent.therapistId,
          startTime: onsiteEvent.startTime,
          endTime: onsiteEvent.endTime,
          summary: onsiteEvent.summary,
          recommendDatetime: therapySession.recommendDatetime,
        })
        .from(therapySession)
        .innerJoin(onsiteEvent, eq(onsiteEvent.id, therapySession.id))
        .where(
          and(
            eq(therapySession.userId, userId),
            isNull(onsiteEvent.startTime),
            isNull(therapySession.completeDatetime),
            isNull(therapySession.enrollDatetime),
            isNotNull(therapySession.recommendDatetime),
          ),
        );

      // attach the correct timezone
      return recommendedSessions;
    },
  );

  fastify.get(
    "/archived",
    {
      schema: {
        response: {
          200: Type.Array(OnsiteEvent),
        },
      },
    },
    async (request) => {
      // @ts-ignore
      const userId = request.user.sub;

      const archivedSessions = await fastify.db
        .select({
          id: therapySession.id,
          therapistId: onsiteEvent.therapistId,
          summary: onsiteEvent.summary,
          startTime: onsiteEvent.startTime,
          endTime: onsiteEvent.endTime,
        })
        .from(therapySession)
        .innerJoin(onsiteEvent, eq(onsiteEvent.id, therapySession.id))
        .where(
          and(
            or(
              lt(sql`${onsiteEvent.endTime}`, sql`DATE(NOW())`),
              lt(sql`${therapySession.completeDatetime}`, sql`DATE(NOW())`),
            ),
            isNotNull(therapySession.enrollDatetime),
            eq(therapySession.userId, userId),
          ),
        );
      return archivedSessions;
    },
  );

  fastify.get<{ Params: OnsiteEventParams }>(
    "/:onsiteEventId",
    {
      schema: {
        params: OnsiteEventParams,
        response: {
          200: OnsiteEvent,
        },
      },
    },
    async (request) => {
      const { onsiteEventId } = request.params;
      // @ts-ignore
      const userId = request.user.sub;

      const [onsiteSession] = await fastify.db
        .select({
          id: therapySession.id,
          therapistId: onsiteEvent.therapistId,
          startTime: onsiteEvent.startTime,
          endTime: onsiteEvent.endTime,
          summary: onsiteEvent.summary,
          recommendDatetime: therapySession.recommendDatetime,
        })
        .from(therapySession)
        .innerJoin(onsiteEvent, eq(onsiteEvent.id, therapySession.id))
        .where(
          and(
            eq(therapySession.userId, userId),
            eq(therapySession.id, onsiteEventId),
          ),
        );

      if (!onsiteSession) {
        throw fastify.httpErrors.notFound(
          `Onsite event of id ${onsiteEventId} is not found.`,
        );
      }
      return onsiteSession;
    },
  );

  fastify.put<{ Params: OnsiteEventParams; Body: OnsiteEventUpdate }>(
    "/:onsiteEventId",
    {
      schema: {
        body: OnsiteEventUpdate,
        params: OnsiteEventParams,
        response: {
          200: OnsiteEvent,
        },
      },
    },
    async (request) => {
      const { onsiteEventId } = request.params;
      // @ts-ignore
      const userId = request.user.sub;
      const [onsiteSession] = await fastify.db
        .update(onsiteEvent)
        .set({
          // @ts-ignore
          startTime: request.body.startTime,
          // @ts-ignore
          endTime: request.body.endTime,
          dataPrivacyString: request.body.dataPrivacy?.join(","),
        })
        .where(eq(onsiteEvent.id, onsiteEventId))
        .returning();

      if (!onsiteSession) {
        throw fastify.httpErrors.notFound(
          `Onsite session with the id of ${onsiteEventId} is not found.`,
        );
      }

      const [updatedOnsiteSession] = await fastify.db
        .select({
          id: therapySession.id,
          therapistId: onsiteEvent.therapistId,
          startTime: onsiteEvent.startTime,
          endTime: onsiteEvent.endTime,
          summary: onsiteEvent.summary,
          recommendDatetime: therapySession.recommendDatetime,
        })
        .from(therapySession)
        .innerJoin(onsiteEvent, eq(onsiteEvent.id, therapySession.id))
        .where(
          and(
            eq(therapySession.userId, userId),
            eq(therapySession.id, onsiteEventId),
          ),
        );

      // update the google calendar with the new session.
      return updatedOnsiteSession;
    },
  );

  fastify.delete<{ Params: OnsiteEventParams }>(
    "/:onsiteEventId",
    {
      schema: {
        params: OnsiteEventParams,
      },
    },
    async (request) => {
      const { onsiteEventId } = request.params;
      // @ts-ignore
      const userId = request.user.sub;

      await fastify.db.transaction(async (trx) => {
        try {
          await trx
            .delete(onsiteEvent)
            .where(and(eq(onsiteEvent.id, onsiteEventId)));

          await trx
            .delete(therapySession)
            .where(
              and(
                eq(therapySession.id, onsiteEventId),
                eq(therapySession.userId, userId),
              ),
            );
        } catch (error) {
          await trx.rollback();
          fastify.log.error(error);
          throw error;
        }
      });

      // delete this event on the respective therapist calendars.
      return { message: "Onsite event deleted sucessfully" };
    },
  );
};

export default onsiteSessions;
