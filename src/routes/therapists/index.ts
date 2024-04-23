import { FastifyPluginAsync } from "fastify";
import { Static, Type } from "@sinclair/typebox";
import { eq } from "drizzle-orm";

import { human, therapist, therapySession, user } from "../../database/schema";
import {
  recommendGroupSession,
  recommendOnsiteSession,
  recommendShamiriDigitalSession,
  recommendTeleTherapySession,
} from "../../lib/therapySession";

const TherapistBase = Type.Object({
  name: Type.String(),
  clinicalLevel: Type.Integer(),
  supportPhone: Type.Boolean(),
  supportInPerson: Type.Boolean(),
  gmail: Type.String(),
  about: Type.String(),
  summary: Type.String(),
  timeZone: Type.String({ default: "Africa/Nairobi" }),
});

const Therapist = Type.Object({
  id: Type.Integer(),
  gender: Type.Optional(Type.String()),
  photoUrl: Type.String(),
  ...TherapistBase.properties,
});

const TherapistCreate = Type.Object({
  ...TherapistBase.properties,
  workingTimeStart: Type.Optional(Type.String({ format: "date-time" })),
  workingTimeEnd: Type.Optional(Type.String({ format: "date-time" })),
  specialtyTags: Type.String(),
  dateOfBirth: Type.String({ format: "date-time" }),
  client_id: Type.Optional(Type.Integer()),
  photoUrl: Type.String(),
});

const TherapistAssignment = Type.Object({
  userId: Type.Integer(),
  eventId: Type.String(),
  shamiriDigitalRecommendation: Type.Optional(Type.String()),
  therapistRecommendation: Type.Optional(Type.String()),
  externalRecommendation: Type.Optional(Type.String()),
  psychologistRecommendation: Type.Optional(Type.String()),
  groupTherapyRecommendation: Type.Optional(Type.String()),
});

const TherapistParams = Type.Object({
  therapistId: Type.Integer(),
});

type Therapist = Static<typeof Therapist>;
type TherapistBase = Static<typeof TherapistBase>;
type TherapistCreate = Static<typeof TherapistCreate>;
type TherapistParams = Static<typeof TherapistParams>;
type TherapistAssignment = Static<typeof TherapistAssignment>;

const therapists: FastifyPluginAsync = async (fastify, _): Promise<void> => {
  // @ts-ignore
  fastify.addHook("onRequest", fastify.authenticate);

  fastify.get(
    "/",
    {
      schema: {
        response: {
          200: Type.Array(Therapist),
        },
      },
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
          photoUrl: therapist.photoUrl,
        })
        .from(therapist)
        .innerJoin(human, eq(human.id, therapist.id));
      return allTherapists;
    },
  );

  fastify.post<{ Body: TherapistCreate }>(
    "/",
    {
      schema: {
        body: TherapistCreate,
        response: {
          201: Therapist,
        },
      },
    },
    async (request, reply) => {
      await fastify.db.transaction(async (trx) => {
        try {
          const [insertedHuman] = await trx
            .insert(human)
            .values({
              name: request.body.name,
              email: request.body.gmail,
            })
            .returning();

          const [insertedTherapist] = await trx
            .insert(therapist)
            .values({
              id: insertedHuman.id,
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
              photoUrl: request.body.photoUrl,
            })
            .returning();

          return reply
            .code(201)
            .send({ ...insertedHuman, ...insertedTherapist });
        } catch (error) {
          fastify.log.error(error);
          await trx.rollback();
          throw error;
        }
      });
    },
  );

  fastify.get<{ Params: TherapistParams }>(
    "/:therapistId",
    {
      schema: {
        response: {
          200: Therapist,
        },
      },
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
          photoUrl: therapist.photoUrl, // configure the space client
        })
        .from(therapist)
        .innerJoin(human, eq(human.id, therapist.id))
        .where(eq(therapist.id, therapistId));

      if (!therapistInformation) {
        throw fastify.httpErrors.notFound(
          `Therapist with the id of ${therapistId} not found.`,
        );
      }
      return therapistInformation;
    },
  );

  fastify.post<{ Body: TherapistAssignment }>(
    "/assignment",
    {
      schema: {
        body: TherapistAssignment,
      },
    },
    async (request, reply) => {
      const {
        userId,
        eventId,
        shamiriDigitalRecommendation,
        therapistRecommendation,
        groupTherapyRecommendation,
      } = request.body;

      const enrolledTherapySession =
        await fastify.db.query.therapySession.findFirst({
          where: eq(therapySession.id, eventId),
        });

      const targetUser = await fastify.db.query.user.findFirst({
        where: eq(user.id, userId),
      });

      if (!targetUser) {
        throw fastify.httpErrors.notFound(
          `User with the id of ${userId} not found.`,
        );
      }

      if (shamiriDigitalRecommendation) {
        const recommendedSession = await recommendShamiriDigitalSession(
          fastify.db,
          userId,
          parseInt(shamiriDigitalRecommendation.trim()),
        );

        return reply.code(201).send(recommendedSession);
      }

      if (therapistRecommendation) {
        if (enrolledTherapySession?.type === "phoneEvent") {
          const teleTherapySession = await recommendTeleTherapySession(
            fastify.db,
            userId,
            parseInt(therapistRecommendation),
          );

          return reply.code(201).send(teleTherapySession);
        } else {
          const onsiteSession = await recommendOnsiteSession(
            fastify.db,
            userId,
            parseInt(therapistRecommendation),
          );

          return reply.code(201).send(onsiteSession);
        }
      }

      if (groupTherapyRecommendation) {
        const groupSession = await recommendGroupSession(
          fastify.db,
          userId,
          parseInt(groupTherapyRecommendation),
        );

        return reply.code(201).send(groupSession);
      }
    },
  );
};

export default therapists;
