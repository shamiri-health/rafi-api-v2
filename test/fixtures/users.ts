import { faker } from "@faker-js/faker";
import {
  human,
  therapist,
  user,
  userAchievement,
} from "../../src/database/schema";
import type { database } from "../../src/lib/db";
import { formatISO } from "date-fns";

export const generateHuman = async (
  db: database["db"],
  id: number | null = null,
) => {
  const result = await db
    .insert(human)
    .values({
      id: id || faker.number.int({ min: 300, max: 6000 }),
      name: faker.person.fullName(),
      role: "user",
      email: faker.internet.email().trim().toLowerCase(),
      mobile: faker.helpers.fromRegExp("254[1-9]{9}").toLowerCase(),
      lastLogin: faker.date.anytime(),
    })
    .returning();

  return result[0];
};

export const generateUser = async (
  db: database["db"],
  id?: number | undefined,
) => {
  let data: Partial<typeof user.$inferInsert> = {
    dateOfBirth: faker.date.birthdate().toISOString(),
    educationalLevel: "College",
    pinH: Buffer.from(
      "$2b$12$geh5R2I.08scNPuug5JnRuf/XXS1JsUKKwXAmz9FWb2BrnA/4Pj5G",
    ),
    clientId: null,
    avatarId: 1,
    alias: faker.internet.userName(),
    gender2: faker.helpers.arrayElement(["MALE", "FEMALE", "OTHER"]),
    profession: "something random",
    registeredOn: new Date(),
  };

  if (id) {
    data.id = id;
  } else {
    const newHuman = await generateHuman(db);
    data.id = newHuman.id;
  }

  const [result] = await db
    .insert(user)
    .values(data as typeof user.$inferSelect)
    .returning();

  await db.insert(userAchievement).values({
    level: 1,
    userId: data.id,
  });

  return result;
};

export const generateTherapist = async (
  db: database["db"],
  id: number | null = null,
  clientId: number | null = null,
) => {
  let data: Partial<typeof therapist.$inferInsert> = {
    about: faker.lorem.words(10),
    gmail: faker.internet.email({ provider: "shamirihealth.com" }),
    dateOfBirth: formatISO(faker.date.anytime(), { representation: "date" }),
    clientId,
  };

  if (id) {
    data.id = id;
  } else {
    const newHuman = await generateHuman(db);
    data.id = newHuman.id;
  }

  const [newTherapist] = await db
    .insert(therapist)
    .values(data as typeof therapist.$inferInsert)
    .returning();

  return newTherapist;
};

// export const generateSymonTherapist = async (db: database["db"]) => {
//   const client = await db.insert(client).
//   const therapistHuman = await db
//     .insert(human)
//     .values({
//       id: 20,
//       name: faker.person.fullName(),
//       role: "therapist",
//       email: faker.internet.email().trim().toLowerCase(),
//       mobile: faker.phone.number(),
//     })
// }
