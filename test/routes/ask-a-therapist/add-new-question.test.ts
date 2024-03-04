import { test } from "tap";
import { build } from "../../helper";
import { faker } from "@faker-js/faker";
import { generateTherapist, generateUser } from "../../fixtures/users";
import {
  human,
  questions,
  therapist,
  user,
} from "../../../src/database/schema";
import { eq } from "lodash";
import { encodeAuthToken } from "../../../src/lib/utils/jwt";
import { inArray } from "drizzle-orm";

test("POST /ask-a-therapist/question should create a question", async (t) => {
  // given
  const app = await build(t);
  const newTherapist = await generateTherapist(app.db);
  const sampleUser = await generateUser(app.db);
  const token = encodeAuthToken(sampleUser.id, "user");

  t.teardown(async () => {
    await app.db.delete(questions).where(eq(questions.userId, sampleUser.id));
    await app.db.delete(therapist).where(eq(therapist.id, newTherapist.id));
    await app.db.delete(user).where(eq(user.id, sampleUser.id));
    await app.db
      .delete(human)
      .where(inArray(human.id, [sampleUser.id, newTherapist.id]));
  });

  const payload = {
    question: faker.lorem.sentence(),
    therapistId: newTherapist.id,
  };

  // when
  const res = await app
    .inject()
    .headers({ authorization: `Bearer ${token}` })
    .post("/ask-a-therapist/question")
    .payload(payload);

  const body = await res.json();

  // then
  t.equal(res.statusCode, 201);
  t.equal(body.question, payload.question);
});

test("POST /ask-a-therapist/question should 401 status code if user is not authenticated", async (t) => {
  // given
  const app = await build(t);

  const payload = {
    question: faker.lorem.sentence(),
  };

  // when
  const res = await app
    .inject()
    .post("/ask-a-therapist/question")
    .payload(payload);

  // then
  t.equal(res.statusCode, 401);
});
