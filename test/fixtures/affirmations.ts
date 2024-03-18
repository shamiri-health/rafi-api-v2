import { faker } from "@faker-js/faker";
import { database } from "../../src/lib/db";
import {
  affirmation,
  affirmationOfTheDay,
  favouritedAffirmation,
} from "../../src/database/schema";
import { randomUUID } from "crypto";

export const generateAffirmation = async (
  db: database["db"],
  userId: number,
) => {
  const now = new Date();
  const [createdAffirmation] = await db
    .insert(affirmation)
    .values({
      id: randomUUID(),
      userId,
      content: faker.lorem.sentence(),
      category: "Mental and Emotional Wellness",
      backgroundFileName: faker.lorem.word(),
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return createdAffirmation;
};

export const generateAffirmationOfTheDay = async (
  db: database["db"],
  userId: number,
) => {
  const now = new Date();
  const [createdAffirmation] = await db
    .insert(affirmationOfTheDay)
    .values({
      id: randomUUID(),
      userId,
      category: "Physical Wellness",
      subCategory: faker.lorem.slug(),
      affirmation: faker.lorem.sentence(),
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return createdAffirmation;
};

export const generateFavouriteAffirmation = async (
  db: database["db"],
  userId: number,
) => {
  const now = new Date();
  const [favouriteAffirmation] = await db
    .insert(favouritedAffirmation)
    .values({
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      category: "Life Skills",
      userId,
    })
    .returning();

  return favouriteAffirmation;
};
