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
  const gemsNextLevel: number = gemsLevel[record.level + 1][1];
  const updatedStreak: number = getUserStreak(record);

  await db
    .update(userAchievement)
    .set({
      gems: totalGems,
      streak: updatedStreak,
      streakUpdatedAt: new Date(),
      level: record.level,
    })
    .where(eq(userAchievement.id, record.id));

  await db.insert(rewardHubRecord).values({
    level: record.level,
    levelName: gemsLevel[record.level][0],
    streak: updatedStreak,
    gemsHave: record.gems,
    gemsNextLevel: gemsNextLevel,
    userId: record.userId,
  });

  if (totalGems >= gemsNextLevel) {
    return await unlockNextLevel(db, record);
  }
  return {};
};

const unlockNextLevel = async (db: database["db"], record: RewardHub) => {
  if (record.level > 9) return;

  const nextLevel: number = record.level + 1;

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

  return {
    displayText: `You have just reached to level ${achievement.level}`,
    level: achievement.level,
    achievement: `achLevel ${achievement.level}`,
  };
};

const getUserStreak = (record: RewardHub) => {
  const NUMBER_OF_SECONDS = 86400; // seconds in 24 hours
  const lastStreakUpdate = new Date(`${record.streakUpdatedAt}`).getTime();
  const currentStreakUpdate = new Date().getTime();
  let currentSteak = record.streak;

  if ((currentStreakUpdate - lastStreakUpdate) / 1000 < NUMBER_OF_SECONDS) {
    return (currentSteak += 1);
  }

  return 1;
};
