import { FastifyPluginAsync } from "fastify";
import CHECKINPROMPTS from "../../../static/daily_checkin_prompts.json";
import { and, eq, sql } from "drizzle-orm";
import { dailyCheckIn, userAchievement } from "../../database/schema";
import { Static, Type } from "@sinclair/typebox";
import { randomUUID } from "crypto";
import { createRewardHubRecord } from "../../lib/userRewardHub";

const DailyCheckInSubmission = Type.Object({
  how_are_you_feeling: Type.String(),
  mood_description: Type.String(),
  mood_description_cause_category_1: Type.String(),
  mood_description_cause_response_1: Type.String(),
  mood_description_cause_category_2: Type.Optional(Type.String()),
  mood_description_cause_response_2: Type.Optional(Type.String()),
  mood_description_cause_category_3: Type.Optional(Type.String()),
  mood_description_cause_response_3: Type.Optional(Type.String()),
});

const DailyCheckInResponse = Type.Object({
  id: Type.String(),
  created_at: Type.String({ format: "date-time" }),
  updated_at: Type.String({ format: "date-time" }),
  how_are_you_feeling: Type.String(),
  mood_description: Type.String(),
  mood_description_cause_category_1: Type.String(),
  mood_description_cause_response_1: Type.String(),
  mood_description_cause_category_2: Type.Optional(Type.String()),
  mood_description_cause_response_2: Type.Optional(Type.String()),
  mood_description_cause_category_3: Type.Optional(Type.String()),
  mood_description_cause_response_3: Type.Optional(Type.String()),
  gems: Type.Integer(),
  streak: Type.Integer(),
});

type DailyCheckInSubmission = Static<typeof DailyCheckInSubmission>;
type DailyCheckInResponse = Static<typeof DailyCheckInResponse>;

const dailyCheckin: FastifyPluginAsync = async (fastify, _): Promise<void> => {
  // @ts-ignore
  fastify.addHook("onRequest", fastify.authenticate);

  fastify.get("/fetch-screen-1", () => {
    return CHECKINPROMPTS.DAILY_CHECK_FEELING;
  });

  fastify.get("/fetch-screen-2", () => {
    return CHECKINPROMPTS.MOOD_DESCRIPTION;
  });

  fastify.get("/fetch-screen-3", () => {
    return CHECKINPROMPTS.MOOD_DESCRIPTION;
  });

  fastify.get(
    "/",
    {
      schema: {
        response: {
          200: Type.Union([DailyCheckInSubmission, Type.Object({})]),
        },
      },
    },
    async (request, _) => {
      //@ts-ignore
      const userId = request.user.sub;
      const checkinRecords = await fastify.db.query.dailyCheckIn.findFirst({
        where: and(
          eq(dailyCheckIn.userId, userId),
          eq(sql`DATE(${dailyCheckIn.createdAt})`, sql`DATE(NOW())`),
        ),
      });

      if (checkinRecords) {
        return checkinRecords;
      }

      return {};
    },
  );

  fastify.post<{ Body: DailyCheckInSubmission }>(
    "/",
    {
      schema: {
        body: DailyCheckInSubmission,
        response: {
          201: DailyCheckInResponse,
        },
      },
    },
    async (request, reply) => {
      // @ts-ignore
      const userId = request.user.sub;
      const today = new Date();
      // @ts-ignore
      const dailyCheckInResult = await fastify.db.transaction(async (trx) => {
        try {
          await trx.insert(dailyCheckIn).values({
            // @ts-ignore
            id: randomUUID(),
            howAreYouFeeling: request.body.how_are_you_feeling,
            moodDescription: request.body.mood_description,
            moodDescriptionCauseCategory1:
              request.body.mood_description_cause_category_1,
            moodDescriptionCauseResponse1:
              request.body.mood_description_cause_response_1,
            moodDescriptionCauseCategory2:
              request.body.mood_description_cause_category_2,
            moodDescriptionCauseResponse2:
              request.body.mood_description_cause_response_2,
            moodDescriptionCauseCategory3:
              request.body.mood_description_cause_category_3,
            moodDescriptionCauseResponse3:
              request.body.mood_description_cause_response_3,
            userId,
            createdAt: today,
          });

          const userAchievementRecord =
            await trx.query.userAchievement.findFirst({
              where: eq(userAchievement.userId, userId),
            });

          if (!userAchievementRecord) {
            throw fastify.httpErrors.notFound("User achievement not found");
          }
          
          const gemsToAdd = 5;
          const rewardHubRecord = await createRewardHubRecord(
            trx,
            // @ts-ignore
            userAchievementRecord,
            gemsToAdd,
          );

          const dailyCheckinRecord = await trx.query.dailyCheckIn.findFirst({
            where: and(
              eq(dailyCheckIn.userId, userId),
              eq(sql`DATE(${dailyCheckIn.createdAt})`, sql`DATE(NOW())`),
            ),
          });

          return {
            id: dailyCheckinRecord?.id,
            gems: rewardHubRecord.gems,
            streak: rewardHubRecord.streak,
            created_at: dailyCheckinRecord?.createdAt,
            updated_at: dailyCheckinRecord?.updatedAt,
            how_are_you_feeling: dailyCheckinRecord?.howAreYouFeeling,
            mood_description: dailyCheckinRecord?.moodDescription,
            mood_description_cause_category_1:
              dailyCheckinRecord?.moodDescriptionCauseCategory1,
            mood_description_cause_response_1:
              dailyCheckinRecord?.moodDescriptionCauseResponse1,
            mood_description_cause_category_2:
              dailyCheckinRecord?.moodDescriptionCauseCategory2,
            mood_description_cause_response_2:
              dailyCheckinRecord?.moodDescriptionCauseResponse2,
            mood_description_cause_category_3:
              dailyCheckinRecord?.moodDescriptionCauseCategory3,
            mood_description_cause_response_3:
              dailyCheckinRecord?.moodDescriptionCauseResponse3,
          };
        } catch (error) {
          await trx.rollback();
          throw error;
        }
      });

      return reply.code(201).send(dailyCheckInResult);
    },
  );
};

export default dailyCheckin;
