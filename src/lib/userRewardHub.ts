import { Static, Type } from "@sinclair/typebox"
import { eq } from "drizzle-orm";
import { database } from "./db";
import { userRewardHub } from "../database/schema";

const RewardHub = Type.Object({
    id: Type.Number(),
    gemHave: Type.Number(),
    level: Type.Number()
})

type RewardHub = Static<typeof RewardHub>;

interface GemLevel {
    [level: number]: [level: string, gems: number]
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
    10: ["Unicorn", 2000]
}

export const addGems = async (db: database['db'], record: RewardHub, nGems: number) => {
    const totalGems: number = record.gemHave + nGems;
    const gemsNextLevel: number = gemsLevel[record.level + 1][1];

    await db.update(userRewardHub)
    .set({ gemsHave: totalGems })
    .where(eq(userRewardHub.id, record.id))
    
    if (totalGems >= gemsNextLevel) {
        // unlock next level
        return await unlockNextLevel(db, record);
    }
    return [];
}

export const unlockNextLevel = async (db: database["db"], record: RewardHub) => {
    if (record.level > 9) return;
    const nextLevel: number = record.level + 1;

    const [updatedRecord] = await db.update(userRewardHub)
    .set({ level: nextLevel })
    .where(eq(userRewardHub.id, record.id))
    .returning();

    return {
        displayText: `You have just reached to level ${updatedRecord.level}`,
        level: updatedRecord.level,
        achievement: `achLevel ${updatedRecord.level}`
    }
}