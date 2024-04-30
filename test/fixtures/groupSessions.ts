import { groupSession } from "../../src/database/schema";
import { database } from "../../src/lib/db";
import { generateGroupTopic } from "./therapySession";
import { generateTherapist } from "./users";

export const generateGroupSession = async (db: database["db"]) => {
  const therapist = await generateTherapist(db);
  const groupTopic = await generateGroupTopic(db, 111);
  const today = new Date();

  const [postedGroupSession] = await db
    .insert(groupSession)
    .values({
      startTime: new Date("2024-04-29 09:00:00"),
      endTime: new Date("2024-04-29 10:00:00"),
      therapistId: therapist.id,
      groupTopicId: groupTopic.id,
      capacity: 15,
      discordLink: "discord link goes here...",
      createdAt: today,
      updatedAt: today,
    })
    .returning();

  return postedGroupSession;
};
