import { test } from "tap";
import { build } from "../../helper";
import { faker } from "@faker-js/faker";
import { generateUser } from "../../fixtures/users";
import { generateQuestionForUser } from "../../fixtures/questions";
import { human, questions, user } from "../../../src/database/schema";
import { eq } from "lodash";
import { encodeAuthToken } from "../../../src/lib/utils/jwt";
import { inArray } from "drizzle-orm";

test("PUT /ask-a-therapist/question/:question_id should allow a user to edit their own question", async (t) => {
  // given
  const app = await build(t);
  const sampleUser = await generateUser(app.db);
  const token = encodeAuthToken(sampleUser.id, "user");
  const userQuestion = await generateQuestionForUser(app.db, sampleUser.id);

  t.teardown(async () => {
    await app.db.delete(questions).where(eq(questions.userId, sampleUser.id));
    await app.db.delete(user).where(eq(user.id, sampleUser.id));
    await app.db.delete(human).where(eq(human.id, sampleUser.id));
  });

  const payload = {
    question: faker.lorem.sentence(),
  };

  // when
  const res = await app
    .inject()
    .headers({ authorization: `Bearer ${token}` })
    .put(`/ask-a-therapist/question/${userQuestion.id}`)
    .payload(payload);

  const body = await res.json();

  // then
  t.equal(res.statusCode, 200);
  t.equal(body.question, payload.question);
  t.ok(
    await app.db.query.questions.findFirst({
      where: eq(questions.question, body.question),
    }),
  );
});

test("PUT /ask-a-therapist/question/:question_id should not allow a user to someone else's question", async (t) => {
  // given
  const app = await build(t);
  const sampleUser = await generateUser(app.db);
  const sampleUser2 = await generateUser(app.db);
  const token = encodeAuthToken(sampleUser.id, "user");
  const questionForUser2 = await generateQuestionForUser(
    app.db,
    sampleUser2.id,
  );

  t.teardown(async () => {
    await app.db.delete(questions).where(eq(questions.userId, sampleUser2.id));
    await app.db
      .delete(user)
      .where(inArray(user.id, [sampleUser.id, sampleUser2.id]));
    await app.db
      .delete(human)
      .where(inArray(human.id, [sampleUser.id, sampleUser2.id]));
  });

  const payload = {
    question: faker.lorem.sentence(),
  };

  // when
  const res = await app
    .inject()
    .headers({ authorization: `Bearer ${token}` })
    .put(`/ask-a-therapist/question/${questionForUser2.id}`)
    .payload(payload);

  // then
  t.equal(res.statusCode, 404);
  t.ok(
    await app.db.query.questions.findFirst({
      where: eq(questions.question, questionForUser2.question),
    }),
  );
});

test("PUT /ask-a-therapist/question should 401 status code if user is not authenticated", async (t) => {
  // given
  const app = await build(t);

  const payload = {
    question: faker.lorem.sentence(),
  };

  // when
  const res = await app
    .inject()
    .put("/ask-a-therapist/question/some-random-id")
    .payload(payload);

  // then
  t.equal(res.statusCode, 401);
});
