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
  achivementRecord: AchievementRecord,
  nGems: number,
) => {
  // @ts-ignore
  const totalGems = achivementRecord.gems + nGems;
  const currentLevel = achivementRecord.level ? achivementRecord.level : 1;
  const gemsNextLevel = GEMS_LEVEL[currentLevel + 1][1];
  const currentLevelName = GEMS_LEVEL[currentLevel][0];
  const updatedStreak: number = getUserStreak(achivementRecord);
  try {
    await db.insert(rewardHubRecord).values({
      level: currentLevel,
      levelName: currentLevelName,
      streak: updatedStreak,
      gemsHave: totalGems,
      gemsNextLevel: gemsNextLevel,
      userId: achivementRecord.userId,
      timestamp: new Date(),
    });

    const [postedAchievement] = await db
      .update(userAchievement)
      .set({
        gems: totalGems,
        streak: updatedStreak,
        streakUpdatedAt: new Date(),
        level: currentLevel,
      })
      .where(eq(userAchievement.id, achivementRecord.id))
      .returning();

    //@ts-ignore
    if (postedAchievement.level > 9) return postedAchievement;

    if (totalGems >= gemsNextLevel) {
      // @ts-ignore
      return await unlockNextLevel(db, postedAchievement);
    }
    return postedAchievement;
  } catch (error) {
    throw error;
  }
};

const unlockNextLevel = async (
  db: database["db"],
  achivementRecord: AchievementRecord,
) => {
  // @ts-ignore
  const nextLevel = achivementRecord.level + 1;
  try {
    await db.insert(rewardHubRecord).values({
      level: nextLevel,
      levelName: GEMS_LEVEL[nextLevel][0],
      gemsNextLevel: GEMS_LEVEL[nextLevel + 1][1],
    });

    const [achievement] = await db
      .update(userAchievement)
      .set({ level: nextLevel })
      .where(eq(userAchievement.id, achivementRecord.id))
      .returning();

    return achievement;
  } catch (error) {
    throw error;
  }
};

const getUserStreak = (achivementRecord: AchievementRecord) => {
  const NUMBER_OF_SECONDS = 86400; // seconds in 24 hours
  const lastStreakUpdate: number = achivementRecord.streakUpdatedAt
    ? new Date(`${achivementRecord.streakUpdatedAt}`).getTime()
    : 0;
  const currentStreakUpdate: number = new Date().getTime();

  if ((currentStreakUpdate - lastStreakUpdate) / 1000 < NUMBER_OF_SECONDS) {
    // @ts-ignore
    return achivementRecord.streak + 1;
  }

  return 1;
};
