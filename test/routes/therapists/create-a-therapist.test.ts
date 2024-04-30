import { test } from "tap";
import { eq } from "drizzle-orm";
import { faker } from "@faker-js/faker";

import { build } from "../../helper";
import { encodeAuthToken } from "../../../src/lib/utils/jwt";
import { generateUser } from "../../fixtures/users";
import { therapist, user } from "../../../src/database/schema";

test("POST /therapists should create a new therapist", async (t) => {
  const app = await build(t);
  const sampleUser = await generateUser(app.db);
  const token = await encodeAuthToken(sampleUser.id, "user");

  t.teardown(async () => {
    await app.db.delete(user).where(eq(user.id, sampleUser.id));
  });

  const payload = {
    name: faker.person.firstName(),
    clinicalLevel: 2,
    supportPhone: true,
    supportInPerson: true,
    gmail: `${faker.lorem.word()}@gmail.com`,
    about: faker.person.jobTitle(),
    summary: faker.person.jobDescriptor(),
    timeZone: "Africa/Nairobi",
    // workingTimeEnd: "09:00:00+03",
    // workingTimeStart: "09:00:00+03",
    specialtyTags: faker.lorem.word(),
    dateOfBirth: faker.date.birthdate(),
    clientId: faker.number.int(),
    photoUrl: faker.lorem.word(),
  };

  const response = await app
    .inject()
    .headers({ authorization: `Bearer ${token}` })
    .post("/therapists/")
    .payload(payload);

  const body = await response.json();

  const createdTherapist = await app.db.query.therapist.findFirst({
    where: eq(therapist.id, body.id),
  });

  t.equal(response.statusCode, 201);
  t.ok(createdTherapist);
});

test("POST /therapists should return 401 if there is invalid token", async (t) => {
  const app = await build(t);
  const sampleUser = await generateUser(app.db);

  t.teardown(async () => {
    await app.db.delete(user).where(eq(user.id, sampleUser.id));
  });

  const payload = {
    name: faker.person.firstName(),
    clinicalLevel: 2,
    supportPhone: true,
    supportInPerson: true,
    gmail: `${faker.lorem.word()}@gmail.com`,
    about: faker.person.jobTitle(),
    summary: faker.person.jobDescriptor(),
    timeZone: "Africa/Nairobi",
    workingTimeEnd: "2024-04-29 12:00",
    workingTimeStart: "2024-04-29 13:00",
    specialtyTags: faker.lorem.word(),
    dateOfBirth: faker.date.birthdate(),
    clientId: faker.number.int(),
    photoUrl: faker.lorem.word(),
  };

  const response = await app.inject().post("/therapists").payload(payload);

  t.equal(response.statusCode, 401);
});
