import { rewardHubRecord, userAchievement } from "../../src/database/schema";
import { database } from "../../src/lib/db";

export const generateRewardHubRecord = async (db: database["db"], userId: number) => {
    const [postedRewardHubRecord] = await db
    .insert(rewardHubRecord)
    .values({
        level: 1,
        gemsHave: 5,
        timestamp: new Date(),
        streak: 0,
        userId
    }).returning()

    return postedRewardHubRecord;
}

export const generateUserAchievement = async (db: database["db"], userId: number) => {
    const [postedUserAchievement] = await db
    .insert(userAchievement)
    .values({ userId })
    .returning();

    return postedUserAchievement;
}