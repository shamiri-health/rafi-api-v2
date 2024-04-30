import { FastifyPluginAsync } from "fastify";
import CHECKINPROMTS from "../../../static/daily_checkin_prompts.json";
import { and, eq, sql } from "drizzle-orm";
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
            const checkinRecords = await fastify.db.query.dailyCheckIn.findFirst({
                where: and(
                    eq(dailyCheckIn.userId, userId),
                    eq(sql`DATE(${dailyCheckIn.createdAt})`, sql`DATE(NOW())`)
                )
            })

            if (checkinRecords) {
                return checkinRecords;
            }

            return {}
        }
    )
}

export default dailyCheckin;
