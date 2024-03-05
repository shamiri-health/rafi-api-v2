import { test } from "tap";
import { build } from "../../helper";
import { generateUser } from "../../fixtures/users";
import { human, questions, user, answers } from "../../../src/database/schema";
import { eq } from "lodash";
import { inArray } from "drizzle-orm";
import {
  generateAnswerForQuestionAndTherapist,
  generateQuestionForUser,
} from "../../fixtures/questions";
import { encodeAuthToken } from "../../../src/lib/utils/jwt";

test("DELETE /ask-a-therapist/question/:question_id should delete a question belonging to the user", async (t) => {
  // given
  const app = await build(t);
  const sampleUser = await generateUser(app.db);
  const userQuestion = await generateQuestionForUser(app.db, sampleUser.id);
  const token = encodeAuthToken(sampleUser.id, "user");
  await generateAnswerForQuestionAndTherapist(app.db, userQuestion.id);

  t.teardown(async () => {
    await app.db.delete(user).where(eq(user.id, sampleUser.id));
    await app.db.delete(human).where(eq(human.id, sampleUser.id));
  });

  // when
  const res = await app
    .inject()
    .headers({ authorization: `Bearer ${token}` })
    .delete(`/ask-a-therapist/question/${userQuestion.id}`);

  // then
  t.equal(res.statusCode, 200);
  t.notOk(
    await app.db.query.questions.findFirst({
      where: eq(questions.id, userQuestion.id),
    }),
  );
  t.notOk(
    await app.db.query.answers.findFirst({
      where: eq(answers.questionId, userQuestion.id),
    }),
  );
});

test("DELETE /ask-a-therapist/question/:question_id should not delete a question belonging to another user", async (t) => {
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

  // when
  const res = await app
    .inject()
    .headers({ authorization: `Bearer ${token}` })
    .delete(`/ask-a-therapist/question/${questionForUser2.id}`);

  // then
  t.equal(res.statusCode, 404);
  t.ok(
    await app.db.query.questions.findFirst({
      where: eq(questions.id, questionForUser2.id),
    }),
  );
});
