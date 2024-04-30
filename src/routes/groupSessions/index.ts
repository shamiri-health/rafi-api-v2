import { Static, Type } from "@sinclair/typebox";
import { FastifyPluginAsync } from "fastify";
import { asc, eq, isNull, sql } from "drizzle-orm";
import {
  groupSession,
  groupTopic,
  human,
  therapist,
} from "../../database/schema";
import { and } from "drizzle-orm";

const Therapist = Type.Object({
  id: Type.Integer(),
  gender: Type.Optional(Type.String()),
  photoUrl: Type.String(),
  name: Type.String(),
  about: Type.String(),
  summary: Type.String(),
});

const GroupSessionBase = Type.Object({
  startTime: Type.String({ format: "date-time" }),
  endTime: Type.String({ format: "date-time" }),
  capacity: Type.Number(),
});

const GroupSessionCreate = Type.Composite([
  GroupSessionBase,
  Type.Object({
    therapistId: Type.Number(),
    groupTopicId: Type.Number(),
    discordLink: Type.String(),
  }),
]);

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
});

const GroupSessionParams = Type.Object({
  groupTopicId: Type.Number(),
});

const GroupSessionQuery = Type.Object({
  startDate: Type.String({ format: "date" }),
});

type GroupSessionParams = Static<typeof GroupSessionParams>;
type GroupSessionQuery = Static<typeof GroupSessionQuery>;
type Therapist = Static<typeof Therapist>;
type GroupTopic = Static<typeof GroupTopic>;
type GroupSession = Static<typeof GroupSession>;
type GroupSessionBase = Static<typeof GroupSessionBase>;
type GroupSessionCreate = Static<typeof GroupSessionCreate>;

const groupSessions: FastifyPluginAsync = async (fastify, _): Promise<void> => {
  // @ts-ignore
  fastify.addHook("onRequest", fastify.authenticate);

  fastify.post<{ Body: GroupSessionCreate }>(
    "/",
    {
      schema: {
        body: GroupSessionCreate,
        response: {
          201: GroupSession,
        },
      },
    },
    async (request, reply) => {
      try {
        const today = new Date();
        const [postedGroupSession] = await fastify.db
          .insert(groupSession)
          .values({
            startTime: new Date(request.body.startTime),
            endTime: new Date(request.body.endTime),
            therapistId: request.body.therapistId,
            groupTopicId: request.body.groupTopicId,
            capacity: request.body.capacity,
            discordLink: request.body.discordLink,
            createdAt: today,
            updatedAt: today,
          })
          .returning();

        const therapistInfo = await fastify.db
          .select()
          .from(therapist)
          .innerJoin(human, eq(human.id, postedGroupSession.therapistId));

        const groupTopicInfo = await fastify.db.query.groupTopic.findFirst({
          where:
            // @ts-ignore
            eq(groupTopic.id, postedGroupSession.groupTopicId),
        });

        return reply.code(201).send({
          id: postedGroupSession.id,
          therapist: {
            ...therapistInfo[0].therapist,
            name: therapistInfo[0].human.name,
          },
          groupTopic: groupTopicInfo,
        });
      } catch (error) {
        fastify.log.error(error);
        throw error;
      }
    },
  );

  fastify.get(
    "/",
    {
      schema: {
        response: {
          200: Type.Array(GroupSession),
        },
      },
    },
    async () => {
      const groupSessions = await fastify.db
        .select()
        .from(groupSession)
        .innerJoin(groupTopic, eq(groupTopic.id, groupSession.groupTopicId))
        .innerJoin(therapist, eq(therapist.id, groupSession.therapistId))
        .innerJoin(human, eq(human.id, therapist.id))
        .orderBy(asc(groupSession.startTime));

      return groupSessions.map((session) => ({
        id: session.groupSession.id,
        therapist: { ...session.therapist, name: session.human.name },
        groupTopic: session.groupTopic,
      }));
    },
  );

  fastify.get<{ Params: GroupSessionParams; Query: GroupSessionQuery }>(
    "/:groupTopicId",
    {
      schema: {
        querystring: GroupSessionQuery,
        params: GroupSessionParams,
        response: {
          200: Type.Array(GroupSession),
        },
      },
    },
    async (request) => {
      const { groupTopicId } = request.params;
      const { startDate } = request.query as GroupSessionQuery;

      const groupSessions = await fastify.db
        .select()
        .from(groupSession)
        .innerJoin(groupTopic, eq(groupTopic.id, groupTopicId))
        .innerJoin(therapist, eq(therapist.id, groupSession.therapistId))
        .innerJoin(human, eq(human.id, therapist.id))
        .where(
          and(
            isNull(groupSession.archivedAt),
            eq(groupSession.groupTopicId, groupTopicId),
            eq(sql`DATE(${groupSession.startTime})`, startDate),
          ),
        );

      return groupSessions.map((session) => ({
        id: session.groupSession.id,
        therapist: { ...session.therapist, name: session.human.name },
        groupTopic: session.groupTopic,
      }));
    },
  );
};
export default groupSessions;
