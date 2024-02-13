import { faker } from "@faker-js/faker";
import { human } from "../../src/database/schema";
import type { database } from "../../src/lib/db";

export const generateHuman = async (db: database["db"]) => {
  const result = await db
    .insert(human)
    .values({
      id: faker.number.int({ min: 300, max: 6000 }),
      name: faker.person.fullName(),
      role: "user",
      email: faker.internet.email().trim().toLowerCase(),
      mobile: faker.helpers.fromRegExp("254[1-9]{9}").toLowerCase(),
      lastLogin: faker.date.anytime().toISOString(),
    })
    .returning();

  return result[0];
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
