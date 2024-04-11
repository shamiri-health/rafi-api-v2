import { FastifyPluginAsync } from "fastify";
import { Static, Type } from "@sinclair/typebox";
import { human, therapist } from "../../database/schema";
import { eq } from "drizzle-orm";

const TherapistBase = Type.Object({
    name: Type.String(),
    clinicalLevel: Type.Integer(),
    supportPhone: Type.Boolean(),
    supportInPerson: Type.Boolean(),
    gmail: Type.String(),
    about: Type.String(),
    summary: Type.String(),
    timeZone: Type.String({ default: "Africa/Nairobi" })
})

const Therapist = Type.Object({
    id: Type.Integer(),
    gender: Type.Optional(Type.String()),
    photoUrl: Type.String(),
    ...TherapistBase.properties
})

const TherapistCreate = Type.Object({
    ...TherapistBase.properties,
    workingTimeStart: Type.String({ format: "date-time" }),
    workingTimeEnd: Type.String({ format: "date-time" }),
    specialtyTags: Type.String(),
    dateOfBirth: Type.String({ format: "date-time" }),
    client_id: Type.Optional(Type.Integer()),
    photoUrl: Type.String()
})

const TherapistParams = Type.Object({
    therapistId: Type.Integer()
})

type Therapist = Static<typeof Therapist>;
type TherapistBase = Static<typeof TherapistBase>;
type TherapistCreate = Static<typeof TherapistCreate>;
type TherapistParams = Static<typeof TherapistParams>;

const therapists: FastifyPluginAsync = async (fastify, _): Promise<void> => {
    // @ts-ignore
    fastify.addHook("onRequest", fastify.authenticate);

    fastify.get("/", 
        {
            schema: {
                response: {
                    200: Type.Array(Therapist)
                }
            }
        },
        async () => {
            const allTherapists = await fastify.db
            .select({ 
                id: therapist.id,
                name: human.name,
                clinicalLevel: therapist.clinicalLevel,
                supportPhone: therapist.supportPhone,
                supportInPerson: therapist.supportInPerson,
                gmail: therapist.gmail,
                about: therapist.about,
                summary: therapist.summary,
                timeZone: therapist.timeZone,
                photoUrl: therapist.photoUrl // configure the space client
            })
            .from(therapist)
            .innerJoin(human, eq(human.id, therapist.id)
            )
            return allTherapists;
        }
    )

    fastify.post <{ Body: TherapistCreate }>("/",
        {
            schema: {
                body: TherapistCreate,
                response: {
                    201: Therapist
                }
            }
        }, 
        async (request, reply) => {
            const [createdTherapist] = await fastify.db
            .insert(therapist)
            .values({
                // @ts-ignore
                name: request.body.name,
                clinicalLevel: request.body.clinicalLevel,
                supportPhone: request.body.supportPhone,
                supportInPerson: request.body.supportInPerson,
                gmail: request.body.gmail,
                about: request.body.about,
                summary: request.body.summary,
                timeZone: request.body.timeZone,
                workingTimeEnd: request.body.workingTimeEnd,
                workingTimeStart: request.body.workingTimeStart,
                specialtyTags: request.body.specialtyTags,
                dateOfBirth: request.body.dateOfBirth,
                clientId: request.body.client_id,
                photoUrl: request.body.photoUrl
            }).returning();

            return reply.code(201).send(createdTherapist)
        }
    )

    fastify.get<{ Params: TherapistParams }>("/:therapistId", 
        {
            schema: {
                response: {
                    200: Therapist
                }
            }
        }, 
        async (request, _) => {
        const { therapistId } = request.params;

        const [therapistInformation] = await fastify.db
        .select({
            id: therapist.id,
            name: human.name,
            clinicalLevel: therapist.clinicalLevel,
            supportPhone: therapist.supportPhone,
            supportInPerson: therapist.supportInPerson,
            gmail: therapist.gmail,
            about: therapist.about,
            summary: therapist.summary,
            timeZone: therapist.timeZone,
            photoUrl: therapist.photoUrl // configure the space client
        })
        .from(therapist)
        .innerJoin(human, eq(human.id, therapist.id))
        .where(eq(therapist.id, therapistId))

        if(!therapistInformation) {
            throw fastify.httpErrors.notFound(
                `Therapist with the id of ${therapistId} not found.`
            )
        }
        return therapistInformation;
    })
}

export default therapists;

