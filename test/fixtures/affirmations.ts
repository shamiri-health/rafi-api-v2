import { faker } from "@faker-js/faker";
import { database } from "../../src/lib/db";
import { affirmation, affirmationOfTheDay, favouritedAffirmation } from "../../src/database/schema";
import { randomUUID } from "crypto";

export const generateAffirmation = async (db: database["db"], userId: number) => {
    const [createdAffirmation] = await db
    .insert(affirmation)
    .values({
        id: randomUUID(),
        userId,
        content: faker.lorem.sentence(),
        category: "Mental and Emotional Wellness",
        backgroundFileName: faker.lorem.word(),
        createdAt: new Date(),
        updatedAt: new Date()
    }).returning()

    return createdAffirmation;
}

export const generateAffirmationOfTheDay = async (db: database["db"], userId: number) => {
    const [createdAffirmation] = await db
    .insert(affirmationOfTheDay)
    .values({
        id: randomUUID(),
        userId,
        category: faker.lorem.word(),
        subCategory: faker.lorem.slug(),
        affirmation: faker.lorem.sentence(),
        createdAt: new Date(),
        updatedAt: new Date()
    }).returning()

    return createdAffirmation;
}

export const generateFavouriteAffirmation = async (db: database["db"], userId: number) => {
    const [favouriteAffirmation] = await db
    .insert(favouritedAffirmation)
    .values({
        id: randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        category: faker.lorem.slug(),
        userId
    }).returning()
    
    return favouriteAffirmation;
}