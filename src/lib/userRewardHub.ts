import { eq } from "drizzle-orm";
import { database } from "./db";
import { rewardHubRecord, userAchievement } from "../database/schema";

interface GemLevel {
  [level: number]: [level: string, gems: number];
}

type AchievementRecord = typeof userAchievement.$inferSelect;

const GEMS_LEVEL: GemLevel = {
  0: ["", 0],
  1: ["Worm", 5],
  2: ["Samaki", 30],
  3: ["Chick", 80],
  4: ["Twiga", 200],
  5: ["Tumbili", 350],
  6: ["Pundamilia", 550],
  7: ["Pomboo", 800],
  8: ["Chui", 1100],
  9: ["Tembo", 1550],
  10: ["Unicorn", 2000],
};

export const createRewardHubRecord = async (
  db: database["db"],
  achievementRecord: AchievementRecord,
  nGems: number,
) => {
  // @ts-ignore
  const totalGems = achievementRecord.gems + nGems;
  const currentLevel = achievementRecord.level ? achievementRecord.level : 1;
  const gemsNextLevel = GEMS_LEVEL[currentLevel + 1][1];
  const nextLevel = totalGems >= gemsNextLevel;
  const level = nextLevel ? currentLevel + 1 : currentLevel;
  const levelName = GEMS_LEVEL[level][0];
  const updatedStreak: number = getUserStreak(achievementRecord);

  // @ts-ignore
  if (achievementRecord.level > 9) return achievementRecord;

  try {
    await db.insert(rewardHubRecord).values({
      level,
      levelName,
      streak: updatedStreak,
      gemsHave: totalGems,
      gemsNextLevel: GEMS_LEVEL[level + 1][1],
      userId: achievementRecord.userId,
      timestamp: new Date(),
    });

    const [postedAchievement] = await db
      .update(userAchievement)
      .set({
        gems: totalGems,
        streak: updatedStreak,
        streakUpdatedAt: new Date(),
        level,
      })
      .where(eq(userAchievement.id, achievementRecord.id))
      .returning();
    return postedAchievement;
  } catch (error) {
    throw error;
  }
};

const getUserStreak = (achievementRecord: AchievementRecord) => {
  const NUMBER_OF_SECONDS = 86400; // seconds in 24 hours
  const lastStreakUpdate: number = achievementRecord.streakUpdatedAt
    ? new Date(`${achievementRecord.streakUpdatedAt}`).getTime()
    : 0;
  const currentStreakUpdate: number = new Date().getTime();

  if ((currentStreakUpdate - lastStreakUpdate) / 1000 < NUMBER_OF_SECONDS) {
    // @ts-ignore
    return achievementRecord.streak + 1;
  }

  return 1;
};
