import { test } from "tap";
import { build } from "../../helper";
import { faker } from "@faker-js/faker";
import { generateTherapist, generateUser } from "../../fixtures/users";
import {
  answers,
  human,
  questions,
  therapist,
  user,
} from "../../../src/database/schema";
import { eq } from "lodash";
import { inArray } from "drizzle-orm";
import { generateQuestionForUser } from "../../fixtures/questions";

test("POST /ask-a-therapist/answer should answer a question given the question_id", async (t) => {
  // given
  const app = await build(t);
  const newTherapist = await generateTherapist(app.db);
  const sampleUser = await generateUser(app.db);
  const userQuestion = await generateQuestionForUser(app.db, sampleUser.id);

  t.teardown(async () => {
    await app.db.delete(questions).where(eq(questions.userId, sampleUser.id));
    await app.db.delete(therapist).where(eq(therapist.id, newTherapist.id));
    await app.db.delete(user).where(eq(user.id, sampleUser.id));
    await app.db
      .delete(human)
      .where(inArray(human.id, [sampleUser.id, newTherapist.id]));
  });

  const payload = {
    answer: faker.lorem.sentence(),
    therapist_id: newTherapist.id,
    question_id: userQuestion.id,
  };

  // when
  const res = await app
    .inject()
    .post("/ask-a-therapist/answer")
    .payload(payload);

  const body = await res.json();

  // then
  t.equal(res.statusCode, 201);
  t.equal(body.answer, payload.answer);
  t.ok(
    await app.db.query.answers.findFirst({ where: eq(answers.id, body.id) }),
  );
});

// TODO: uncomment this out once we add authentication logic
// test("POST /ask-a-therapist/answer should return 401 status code if therapist is not authenticated", async (t) => {
//   // given
//   const app = await build(t);
//
//   const payload = {
//     question: faker.lorem.sentence(),
//   };
//
//   // when
//   const res = await app
//     .inject()
//     .post("/ask-a-therapist/answer")
//     .payload(payload);
//
//   // then
//   t.equal(res.statusCode, 401);
// });
