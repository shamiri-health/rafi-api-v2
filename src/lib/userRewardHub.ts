// def gemsNextLevel(self):
//         gems_level = {
//             0: ("", 0),
//             1: ("Worm", 5),
//             2: ("Samaki", 30),
//             3: ("Chick", 80),
//             4: ("Twiga", 200),
//             5: ("Tumbili", 350),
//             6: ("Pundamilia", 550),
//             7: ("Pomboo", 800),
//             8: ("Chui", 1100),
//             9: ("Tembo", 1550),
//             10: ("Unicorn", 2000),
//         }
//         return gems_level[self.level + 1][1]

import { Static, Type } from "@sinclair/typebox"
import { database } from "./db";
import { userRewardHub } from "../database/schema";
import { eq } from "drizzle-orm";

//     def __repr__(self):
//         return "<UserRewardHub %r>" % self.id

//     def level_up(self):
//         if self.level > 9:
//             return None
//         self.level = self.level + 1
//         achievement = self.userAchievement
//         setattr(achievement, "achLevel" + str(self.level), datetime.utcnow())
//         resp = {
//             "displayText": "You have just reached to level " + str(self.level),
//             "level": self.level,
//             "achievement": "achLevel" + str(self.level),
//         }
//         return resp

// def add_gems(self, nGems):
//         response = {}
//         self.gemsHave = self.gemsHave + nGems
//         if self.gemsHave >= self.gemsNextLevel:
//             response = self.level_up()
//         if response:
//             return [response]
//         else:
//             return []
const RewardHub = Type.Object({
    id: Type.Number(),
    gemHave: Type.Number()
})
type RewardHub = Static<typeof RewardHub>;
export const addGems = async (db: database['db'], record: RewardHub, nGems: number) => {
    const totalGems = record.gemHave + nGems;
    const gemsNextLevel = 0;

    await db.update(userRewardHub)
    .set({ gemsHave: totalGems })
    .where(eq(userRewardHub.id, record.id))
    
    if (totalGems >= gemsNextLevel) {

    }
}