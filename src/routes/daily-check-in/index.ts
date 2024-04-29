import { FastifyPluginAsync } from "fastify";
import CHECKINPROMTS from "../../../static/daily_checkin_prompts.json";
import { eq, sql } from "drizzle-orm";
import { dailyCheckIn, userAchievement, userRewardHub } from "../../database/schema";
import { Static, Type } from "@sinclair/typebox";
import { randomUUID } from "crypto";

const DailyCheckInSubmission = Type.Object({
    how_are_you_feeling: Type.String(),
    mood_description: Type.String(),
    mood_description_cause_category_1: Type.String(),
    mood_description_cause_response_1: Type.String(),
    mood_description_cause_category_2: Type.Optional(Type.Array(Type.String())),
    mood_description_cause_response_2: Type.Optional(Type.Array(Type.String())),
    mood_description_cause_category_3: Type.Optional(Type.Array(Type.String())),
    mood_description_cause_response_3: Type.Optional(Type.Array(Type.String())),
})

const DailyCheckInResponse = Type.Object({
    id: Type.String(),
    created_at: Type.String({ format: "date-time" }),
    updated_at: Type.String({ format: "date-time" }),
    how_are_you_feeling: Type.String(),
    mood_description: Type.String(),
    mood_description_cause_category_1: Type.String(),
    mood_description_cause_response_1: Type.String(),
    mood_description_cause_category_2: Type.Optional(Type.Array(Type.String())),
    mood_description_cause_response_2: Type.Optional(Type.Array(Type.String())),
    mood_description_cause_category_3: Type.Optional(Type.Array(Type.String())),
    mood_description_cause_response_3: Type.Optional(Type.Array(Type.String())),
    gems: Type.Integer(),
    streak: Type.Integer(),
    prompt_weekly: Type.Boolean()
})

type DailyCheckInSubmission = Static<typeof DailyCheckInSubmission>;
type DailyCheckInResponse = Static<typeof DailyCheckInResponse>;

const dailyCheckin: FastifyPluginAsync = async (fastify, _): Promise<void> => {
    // @ts-ignore
    fastify.addHook("onRequest", fastify.authenticate);

    fastify.get("/fetch-screen-1", () => {
        return CHECKINPROMTS.DAILY_CHECK_FEELING;
    })

    fastify.get("/fetch-screen-2", () => {
        return CHECKINPROMTS.MOOD_DESCRIPTION;
    })

    fastify.get("/fetch-screen-3", () => {
        return CHECKINPROMTS.MOOD_DESCRIPTION;
    })

    fastify.get("/", 
        {
            schema: {
                response: {
                    200: Type.Union([DailyCheckInSubmission, Type.Object({})])
                }
            }
        }, 
        async (request, _) => {
            //@ts-ignore
            const userId = request.user.sub;
            const query = sql`SELECT * from ${dailyCheckIn} WHERE ${dailyCheckIn.userId} = ${userId} and DATE(${dailyCheckIn.createdAt}) = DATE(NOW())`;
            const [checkinRecords] = await fastify.db.execute(query);

            if (checkinRecords) {
                return checkinRecords;
            }

            return {}
        }
    )

    fastify.post<{ Body: DailyCheckInSubmission }>("/", 
        {
            schema: {
                body: DailyCheckInSubmission,
                response: {
                    201: DailyCheckInResponse
                }
            }
        }, 
        async (request, reply) => {
            const checkinResult = await fastify.db.transaction(async (trx) => {
                try {
                    // @ts-ignore
                    const userId = request.user.sub;

                    await trx.insert(dailyCheckIn)
                    .values({
                        // @ts-ignore
                        id: randomUUID(),
                        howAreYouFeeling: request.body.how_are_you_feeling,
                        moodDescription: request.body.mood_description,
                        moodDescriptionCauseCategory1: request.body.mood_description_cause_category_1,
                        moodDescriptionCauseResponse1: request.body.mood_description_cause_response_1,
                        moodDescriptionCauseCategory2: request.body.mood_description_cause_category_2,
                        moodDescriptionCauseResponse2: request.body.mood_description_cause_response_2,
                        moodDescriptionCauseCategory3: request.body.mood_description_cause_category_3,
                        moodDescriptionCauseResponse3: request.body.mood_description_cause_response_3,
                        userId
                    }).returning()

                    const rewardHubRecord = await trx.query.userRewardHub.findFirst({
                        where: eq(userRewardHub.userId, userId)
                    })

                    if (!rewardHubRecord) {
                        const [userRewardHubRecord] = await trx.insert(userRewardHub)
                        .values({
                            level: 0,
                            userId,
                            gemsHave: 0
                        }).returning()

                        await trx.insert(userAchievement)
                        .values({
                            userRewardHubId: userRewardHubRecord.id,
                            userId,
                            streakUpdatedAt: new Date(),
                        }).returning()
                    }

                    const userAchievementRecord = await trx.query.userAchievement.findFirst({
                        // @ts-ignore
                        where: eq(userAchievement.userId, rewardHubRecord?.id),
                    }) 

                    if (!userAchievementRecord) {
                        await trx.insert(userAchievement)
                        .values({
                            streakUpdatedAt: new Date()
                        })
                    }

                    // add 5 gems for checking in and move the user to next level if the need be
                    const gemsHave = rewardHubRecord?.gemsHave;
                    await trx.update(userRewardHub)
                    .set({
                        gemsHave: gemsHave ? gemsHave + 5 : 0
                    })
                    // link userRewardHub record to RewardHub table
                    // update the streak and gems
                    const streak = userAchievementRecord?.streak;
                    const gems = userAchievementRecord?.gems;
                    const streakUpdatedAt = userAchievementRecord?.streakUpdatedAt;

                    await trx.update(userAchievement)
                    .set({
                        streak: streak ? streak + 1 : 0,
                        gems: gems ? gems + 5 : 0,
                        streakUpdatedAt: streakUpdatedAt ? streakUpdatedAt : new Date(Date.now())
                    })
                    .where(eq(userAchievement.userId, userId))
                    .returning();

                } catch (error) {
                    
                }
            })

            return reply.code(201).send(checkinResult);
        }
    )
}

export default dailyCheckin;