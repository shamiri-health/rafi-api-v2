import { Static, Type } from "@sinclair/typebox";
import { eq } from "drizzle-orm";
import { database } from "./db";
import { rewardHubRecord, userAchievement } from "../database/schema";

const RewardHub = Type.Object({
  id: Type.Number(),
  gems: Type.Number(),
  level: Type.Number(),
  streak: Type.Number(),
  userId: Type.Number(),
  streakUpdatedAt: Type.Optional(Type.String({ format: "date-time" })),
});

type RewardHub = Static<typeof RewardHub>;

interface GemLevel {
  [level: number]: [level: string, gems: number];
}
const gemsLevel: GemLevel = {
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
  record: RewardHub,
  nGems: number,
) => {
  const totalGems: number = record.gems + nGems;
  const level = record.level ? record.level : 1;
  const gemsNextLevel: number = gemsLevel[level + 1][1];
  const levelName: string = gemsLevel[level][0];
  const updatedStreak: number = getUserStreak(record);
  try {
    await db.insert(rewardHubRecord).values({
      level,
      levelName,
      streak: updatedStreak,
      gemsHave: totalGems,
      gemsNextLevel: gemsNextLevel,
      userId: record.userId,
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
      .where(eq(userAchievement.id, record.id))
      .returning();

    if (totalGems >= gemsNextLevel) {
      // @ts-ignore
      return await unlockNextLevel(db, postedAchievement);
    }
    return postedAchievement;
  } catch (error) {
    throw error;
  }
};

const unlockNextLevel = async (db: database["db"], record: RewardHub) => {
  if (record.level > 9) return record;
  const nextLevel: number = record.level + 1;
  try {
    await db.insert(rewardHubRecord).values({
      level: nextLevel,
      levelName: gemsLevel[nextLevel][0],
      gemsNextLevel: gemsLevel[nextLevel + 1][1],
    });

    const [achievement] = await db
      .update(userAchievement)
      .set({ level: nextLevel })
      .where(eq(userAchievement.id, record.id))
      .returning();

    return achievement;
  } catch (error) {
    throw error;
  }
};

const getUserStreak = (record: RewardHub) => {
  const NUMBER_OF_SECONDS = 86400; // seconds in 24 hours
  const lastStreakUpdate: number = record.streakUpdatedAt
    ? new Date(`${record.streakUpdatedAt}`).getTime()
    : 0;
  const currentStreakUpdate: number = new Date().getTime();
  let currentSteak: number = record.streak;

  if ((currentStreakUpdate - lastStreakUpdate) / 1000 < NUMBER_OF_SECONDS) {
    return (currentSteak += 1);
  }

  return 1;
};
