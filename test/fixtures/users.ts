import { faker } from "@faker-js/faker";
import { human } from "../../src/database/schema";
import type { database } from "../../src/lib/db";

export const generateHuman = async (db: database["db"]) => {
  const result = await db
    .insert(human)
    .values({
      name: faker.person.fullName(),
      role: "user",
      email: faker.internet.email().trim().toLowerCase(),
      mobile: faker.helpers.fromRegExp("254[1-9]{9}").toLowerCase(),
      lastLogin: faker.date.anytime().toISOString(),
    })
    .returning();

  return result[0];
};
