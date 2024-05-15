import { eq } from "drizzle-orm";
import { database } from "../../src/lib/db";
import { userAchievement } from "../../src/database/schema";

export const updateLastCheckin = async (
  db: database["db"],
  userId: number,
  gems: number,
) => {
  const today = new Date();

  const [achievementRecord] = await db
    .update(userAchievement)
    .set({
      gems,
      level: 1,
      streak: 1,
      streakUpdatedAt: today,
    })
    .where(eq(userAchievement.userId, userId))
    .returning();

  return achievementRecord;
};
