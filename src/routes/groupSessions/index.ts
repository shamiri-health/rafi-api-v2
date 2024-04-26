import { Static, Type } from "@sinclair/typebox";
import { FastifyPluginAsync } from "fastify";
import { asc, sql } from "drizzle-orm";
import { groupSession } from "../../database/schema";

const Therapist = Type.Object({
    id: Type.Integer(),
    gender: Type.Optional(Type.String()),
    photoUrl: Type.String(),
    name: Type.String(),
    clinicalLevel: Type.Integer(),
    supportPhone: Type.Boolean(),
    supportInPerson: Type.Boolean(),
    gmail: Type.String(),
    about: Type.String(),
    summary: Type.String(),
    timeZone: Type.String({ default: "Africa/Nairobi" }),
});

const GroupSessionBase = Type.Object({
    startTime: Type.String({ format: "date-time" }),
    endTime: Type.String({ format: "date-time" }),
    capacity: Type.Number()
})

const GroupSessionCreate = Type.Composite([
    GroupSessionBase,
    Type.Object({
        therapistId: Type.Number(),
        groupTopicId: Type.Number(),
        discordLink: Type.String()
    })
])

const GroupTopic = Type.Object({
    id: Type.String(),
    name: Type.String(),
    about: Type.String(),
    summary: Type.String()
})

const GroupSession = Type.Object({
    id: Type.String(),
    therapist: Therapist,
    groupTopic: GroupTopic
})

const GroupSessionParams = Type.Object({
    groupTopicId: Type.Number(),
    startDate: Type.String({ format: "date-time" })
})

type Therapist = Static<typeof Therapist>;
type GroupTopic = Static<typeof GroupTopic>;
type GroupSessionParams = Static<typeof GroupSessionParams>;
type GroupSession = Static<typeof GroupSession>;
type GroupSessionBase = Static<typeof GroupSessionBase>;
type GroupSessionCreate = Static<typeof GroupSessionCreate>;

const groupSessions: FastifyPluginAsync = async (fastify, _): Promise<void> => {
    // @ts-ignore
    fastify.addHook("onRequest", fastify.authenticate);

    fastify.post<{ Body: GroupSessionCreate }>("/", 
        {
            schema: {
                body: GroupSessionCreate,
                response: {
                    201: GroupSession
                }
            }
        }, 
        async (request, reply) => {
            const today = new Date();
            const [postedGroupSession] = await fastify.db
            .insert(groupSession)
            .values({
                // @ts-ignore
                startTime: request.body.startTime,
                endTime: request.body.endTime,
                therapistId: request.body.therapistId,
                groupTopicId: request.body.groupTopicId,
                capacity: request.body.capacity,
                discordLink: request.body.discordLink,
                createdAt: today,
                updatedAt: today
            }).returning();

            return reply.code(201).send(postedGroupSession);
        }
    )

    fastify.get("/", {}, async () => {
        const groupSessions = await fastify.db.query.groupSession.findMany({
            orderBy: asc(groupSession.startTime)
        })
            return groupSessions;
        }
    )

    fastify.get<{ Params: GroupSessionParams }>("/:groupTopicId", 
        {}, 
        async (request) => {
            const { groupTopicId, startDate } = request.params;
            const query = sql `
                SELECT * from ${groupSession}
                WHERE DATE(${groupSession.startTime}) = DATE(${startDate})
                AND ${groupSession.archivedAt} IS NULL
                AND ${groupSession.groupTopicId} = ${groupTopicId}
            `
            const groupSessions = await fastify.db.execute(query);
            return groupSessions;
        }
    )

}
export default groupSessions;