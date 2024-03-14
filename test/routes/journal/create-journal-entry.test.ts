import { test } from "tap";
import { build } from "../../helper";
import { faker } from "@faker-js/faker";
import { encodeAuthToken } from "../../../src/lib/utils/jwt";
import { generateUser } from "../../fixtures/users";
import { journal, user } from "../../../src/database/schema";
import { and, eq } from "drizzle-orm";

test("POST /journaling/ should create a journal entry", async (t) => {
  // given
  const app = await build(t);
  const sampleUser = await generateUser(app.db);
  const token = encodeAuthToken(sampleUser.id, "user");

  t.teardown(async () => {
    await app.db.delete(journal).where(eq(journal.userId, sampleUser.id));
    await app.db.delete(user).where(eq(user.id, sampleUser.id));
  });

  const payload = {
    question_1: faker.lorem.sentence(),
    content_1: faker.lorem.sentence(),
    tag: faker.lorem.word(),
    question_2: faker.lorem.sentence(),
    content_2: faker.lorem.sentence(),
    question_3: faker.lorem.sentence(),
    content_3: faker.lorem.sentence(),
  };

  // when
  const response = await app
    .inject()
    .headers({ authorization: `Bearer ${token}` })
    .post("/journaling")
    .payload(payload);

  const body = await response.json();

  // then
  t.equal(response.statusCode, 201);
  const insertedJournal = await app.db.query.journal.findFirst({
    where: and(eq(journal.id, body.id), eq(journal.userId, sampleUser.id)),
  });
  t.ok(insertedJournal);
});

test("POST /journaling/ should return  401 status code if user is not authenticated.", async (t) => {
  // given
  const app = await build(t);

  const payload = {
    question_1: faker.lorem.sentence(),
    content_1: faker.lorem.sentence(),
    tag: faker.lorem.word(),
    question_2: faker.lorem.sentence(),
    content_2: faker.lorem.sentence(),
    question_3: faker.lorem.sentence(),
    content_3: faker.lorem.sentence(),
  };

  // when
  const response = await app.inject().post("/journaling").payload(payload);

  //then
  t.equal(response.statusMessage, "Unauthorized");
  t.equal(response.statusCode, 401);
});
