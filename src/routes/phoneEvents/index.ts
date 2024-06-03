import { and, eq, gte, isNotNull, isNull, lt, or, sql } from "drizzle-orm";
import { FastifyPluginAsync } from "fastify";
import { phoneEvent, therapySession } from "../../database/schema";
import { Static, Type } from "@sinclair/typebox";

const PhoneEventCreate = Type.Object({
  startTime: Type.String({ format: "date-time" }),
  endTime: Type.String({ format: "date-time" }),
  mobile: Type.Optional(Type.String()),
  email: Type.String({ format: "email" }),
  therapistId: Type.Number(),
  clinicalLevel: Type.Number(),
  dataPrivacy: Type.Array(Type.String()),
  paymentToken: Type.String(),
  eventId: Type.Optional(Type.String()),
});

const PhoneEventUpdate = Type.Object({
  startTime: Type.String({ format: "date-time" }),
  endTime: Type.String({ format: "date-time" }),
  mobile: Type.Optional(Type.String()),
  email: Type.String({ format: "email" }),
  dataPrivacy: Type.Array(Type.String()),
});

const PhoneEvent = Type.Object({
  id: Type.String(),
  therapistId: Type.Number(),
  summary: Type.Optional(Type.String()),
  startTime: Type.String({ format: "date-time" }),
  endTime: Type.String({ format: "date-time" }),
  recommendDatetime: Type.Optional(Type.String({ format: "date-time" })),
  completeDatetime: Type.Optional(Type.String({ format: "date-time" })),
  mobile: Type.Optional(Type.String()),
  email: Type.Optional(Type.String()),
  assetUrl: Type.Optional(Type.String()),
  attendance: Type.Optional(Type.String()),
  backgroundColor: Type.Optional(Type.String()),
  buttonColor: Type.Optional(Type.String()),
  credit: Type.Optional(Type.Number()),
  type: Type.Optional(Type.String()),
  dataPrivacy: Type.Optional(Type.Array(Type.String())),
  relatedDomains: Type.Optional(Type.String()),
});

const PhoneEventParams = Type.Object({
  phoneEventId: Type.String(),
});

type PhoneEvent = Static<typeof PhoneEvent>;
type PhoneEventCreate = Static<typeof PhoneEventCreate>;
type PhoneEventUpdate = Static<typeof PhoneEventUpdate>;
type PhoneEventParams = Static<typeof PhoneEventParams>;

const phoneEvents: FastifyPluginAsync = async (fastify, _): Promise<void> => {
  // @ts-ignore
  fastify.addHook("onRequest", fastify.authenticate);

  fastify.post<{ Body: PhoneEventCreate }>(
    "/",
    {
      schema: {
        body: PhoneEventCreate,
        response: {
          201: PhoneEvent,
        },
      },
    },
    async (request, reply) => {
      // @ts-ignore
      const userId = request.user.sub;
      // Verify if already booked
      try {
      } catch (error) {}
    },
  );

  fastify.get(
    "/",
    {
      schema: {
        response: {
          200: Type.Array(PhoneEvent),
        },
      },
    },
    async (request) => {
      // @ts-ignore
      const userId = request.user.sub;
      const phoneEvents = await fastify.db.query.therapySession.findMany({
        where: and(
          eq(therapySession.userId, userId),
          eq(therapySession.type, "phoneEvent"),
        ),
      });

      return phoneEvents;
    },
  );

  fastify.get(
    "/recommended",
    {
      schema: {
        response: {
          200: Type.Array(PhoneEvent),
        },
      },
    },
    async (request) => {
      // @ts-ignore
      const userId = request.user.sub;

      const recommendedSession = await fastify.db
        .select({
          id: therapySession.id,
          therapistId: phoneEvent.therapistId,
          relatedDomains: therapySession.relatedDomains,
          summary: phoneEvent.summary,
          startTime: phoneEvent.startTime,
          endTime: phoneEvent.endTime,
          mobile: phoneEvent.mobile,
          email: phoneEvent.email,
          credit: therapySession.credit,
          recommendDatetime: therapySession.recommendDatetime,
        })
        .from(therapySession)
        .innerJoin(phoneEvent, eq(phoneEvent.id, therapySession.id))
        .where(
          and(
            isNull(phoneEvent.startTime),
            isNull(therapySession.completeDatetime),
            isNull(therapySession.enrollDatetime),
            isNotNull(therapySession.recommendDatetime),
            eq(therapySession.userId, userId),
          ),
        );
      // attach the correct timezones
      return recommendedSession;
    },
  );

  fastify.get(
    "/enrolled",
    {
      schema: {
        response: {
          200: Type.Array(PhoneEvent),
        },
      },
    },
    async (request) => {
      // @ts-ignore
      const userId = request.user.sub;
      const enrolledSessions = await fastify.db
        .select({
          id: therapySession.id,
          therapistId: phoneEvent.therapistId,
          relatedDomains: therapySession.relatedDomains,
          summary: phoneEvent.summary,
          startTime: phoneEvent.startTime,
          endTime: phoneEvent.endTime,
          mobile: phoneEvent.mobile,
          email: phoneEvent.email,
          credit: therapySession.credit,
          recommendDatetime: therapySession.recommendDatetime,
        })
        .from(therapySession)
        .innerJoin(phoneEvent, eq(phoneEvent.id, therapySession.id))
        .where(
          and(
            isNotNull(therapySession.enrollDatetime),
            gte(sql`DATE(${phoneEvent.endTime})`, sql`DATE(NOW())`),
            eq(therapySession.userId, userId),
            eq(therapySession.type, "phoneEvent"),
          ),
        );
      // set background colors and the timezones
      return enrolledSessions;
    },
  );

  fastify.get(
    "/completed",
    {
      schema: {
        response: {
          200: Type.Array(PhoneEvent),
        },
      },
    },
    async (request) => {
      // @ts-ignore
      const userId = request.user.sub;

      const completedSessions = await fastify.db
        .select({
          id: therapySession.id,
          therapistId: phoneEvent.therapistId,
          relatedDomains: therapySession.relatedDomains,
          summary: phoneEvent.summary,
          startTime: phoneEvent.startTime,
          endTime: phoneEvent.endTime,
          mobile: phoneEvent.mobile,
          email: phoneEvent.email,
          credit: therapySession.credit,
          recommendDatetime: therapySession.recommendDatetime,
        })
        .from(therapySession)
        .innerJoin(phoneEvent, eq(phoneEvent.id, therapySession.id))
        .where(
          and(
            isNotNull(therapySession.enrollDatetime),
            isNotNull(therapySession.completeDatetime),
            eq(therapySession.userId, userId),
          ),
        );

      return completedSessions;
    },
  );

  fastify.get(
    "/archived",
    {
      schema: {
        response: {
          200: Type.Array(PhoneEvent),
        },
      },
    },
    async (request) => {
      // @ts-ignore
      const userId = request.user.sub;

      const archivedSessions = await fastify.db
        .select({
          id: therapySession.id,
          therapistId: phoneEvent.therapistId,
          relatedDomains: therapySession.relatedDomains,
          summary: phoneEvent.summary,
          startTime: phoneEvent.startTime,
          endTime: phoneEvent.endTime,
          mobile: phoneEvent.mobile,
          email: phoneEvent.email,
          credit: therapySession.credit,
          recommendDatetime: therapySession.recommendDatetime,
        })
        .from(therapySession)
        .innerJoin(phoneEvent, eq(phoneEvent.id, therapySession.id))
        .where(
          and(
            or(
              lt(sql`${phoneEvent.endTime}`, sql`DATE(NOW())`),
              lt(sql`${therapySession.completeDatetime}`, sql`DATE(NOW())`),
            ),
            isNotNull(therapySession.enrollDatetime),
            eq(therapySession.userId, userId),
          ),
        );
      return archivedSessions;
    },
  );

  fastify.get<{ Params: PhoneEventParams }>(
    "/:phoneEventId",
    {
      schema: {
        response: {
          200: PhoneEvent,
        },
      },
    },
    async (request) => {
      // @ts-ignore
      const userId = request.user.sub;
      const { phoneEventId } = request.params;
      const [teleTherapySession] = await fastify.db
        .select({
          id: therapySession.id,
          therapistId: phoneEvent.therapistId,
          relatedDomains: therapySession.relatedDomains,
          summary: phoneEvent.summary,
          startTime: phoneEvent.startTime,
          endTime: phoneEvent.endTime,
          mobile: phoneEvent.mobile,
          email: phoneEvent.email,
          credit: therapySession.credit,
          recommendDatetime: therapySession.recommendDatetime,
        })
        .from(therapySession)
        .innerJoin(phoneEvent, eq(phoneEvent.id, therapySession.id))
        .where(
          and(
            eq(therapySession.userId, userId),
            eq(therapySession.id, phoneEventId),
          ),
        );

      if (!teleTherapySession) {
        fastify.httpErrors.notFound(
          `PhoneEvent with the id of ${phoneEventId} is not found.`,
        );
      }

      return teleTherapySession;
    },
  );

  fastify.put<{ Params: PhoneEventParams; Body: PhoneEventUpdate }>(
    "/:phoneEventId",
    {
      schema: {
        body: PhoneEventUpdate,
        response: {
          200: PhoneEvent,
        },
      },
    },
    async (request) => {
      // @ts-ignore
      const userId = request.user.sub;
      const { phoneEventId } = request.params;

      const [updatedPhoneEvent] = await fastify.db
        .update(phoneEvent)
        .set({
          mobile: request.body.mobile,
          email: request.body.email,
          // @ts-ignore
          startTime: request.body.startTime,
          // @ts-ignore
          endTime: request.body.endTime,
          dataPrivacyString: request.body.dataPrivacy.join(","),
        })
        .where(eq(phoneEvent.id, phoneEventId));

      const [teleTherapySession] = await fastify.db
        .select({
          id: therapySession.id,
          therapistId: phoneEvent.therapistId,
          relatedDomains: therapySession.relatedDomains,
          summary: phoneEvent.summary,
          startTime: phoneEvent.startTime,
          endTime: phoneEvent.endTime,
          mobile: phoneEvent.mobile,
          email: phoneEvent.email,
          credit: therapySession.credit,
          recommendDatetime: therapySession.recommendDatetime,
        })
        .from(therapySession)
        .innerJoin(phoneEvent, eq(phoneEvent.id, therapySession.id))
        .where(
          and(
            eq(therapySession.userId, userId),
            eq(therapySession.id, phoneEventId),
          ),
        );

      if (!updatedPhoneEvent) {
        throw fastify.httpErrors.notFound(
          `PhoneEvent with the id of ${phoneEventId} is not found.`,
        );
      }

      // update the same event on the therapists calendar

      return teleTherapySession;
    },
  );

  fastify.delete<{ Params: PhoneEventParams }>(
    "/:phoneEventId",
    async (request) => {
      // @ts-ignore
      const userId = request.user.sub;
      const { phoneEventId } = request.params;

      await fastify.db.transaction(async (trx) => {
        try {
          await trx.delete(phoneEvent).where(eq(phoneEvent.id, phoneEventId));
          await trx
            .delete(therapySession)
            .where(
              and(
                eq(therapySession.userId, userId),
                eq(therapySession.id, phoneEventId),
              ),
            );
        } catch (error) {
          fastify.log.error(error);
          await trx.rollback();
          throw error;
        }
      });
      // Delete this event from the google calendar

      return { message: `Phone event ${phoneEventId} deleted successfully` };
    },
  );
};

export default phoneEvents;
