import { randomUUID } from "crypto";
import { faker } from "@faker-js/faker";
import { journal } from "../../src/database/schema";
import { database } from "../../src/lib/db";

export const generateJournalEntry = async (
  db: database["db"],
  userId: number,
) => {
  const [createdJournalEntry] = await db
    .insert(journal)
    .values({
      id: randomUUID(),
      content1: faker.lorem.sentence(),
      question1: faker.lorem.sentence(),
      question2: faker.lorem.sentence(),
      content2: faker.lorem.sentence(),
      content3: faker.lorem.sentence(),
      question3: faker.lorem.sentence(),
      userId,
    })
    .returning();

  return createdJournalEntry;
};
