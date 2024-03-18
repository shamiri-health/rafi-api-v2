import { test } from "tap";
import { faker } from "@faker-js/faker";
import { build } from "../../helper";
import { generateUser } from "../../fixtures/users";
import { encodeAuthToken } from "../../../src/lib/utils/jwt";
import { affirmation, user } from "../../../src/database/schema";
import { and, eq } from "drizzle-orm";

test("POST /affirmations should return 400 if the category choice is invalid", async (t) => {
  // given
  const app = await build(t);
  const sampleUser = await generateUser(app.db);
  const token = await encodeAuthToken(sampleUser.id, "user");

  t.teardown(async () => {
    await app.db.delete(user).where(eq(user.id, sampleUser.id));
  });

  const payload = {
    content: faker.lorem.sentence(),
    category: faker.lorem.slug,
    background_file_name: faker.lorem.word(),
  };

  const response = await app
    .inject()
    .headers({ authorization: `Bearer ${token}` })
    .post("/affirmations")
    .payload(payload);

  t.equal(response.statusMessage, "Bad Request");
  t.equal(response.statusCode, 400);
});

test("POST /affirmations should create a new affirmation", async (t) => {
  const app = await build(t);
  const sampleUser = await generateUser(app.db);
  const token = encodeAuthToken(sampleUser.id, "user");

  t.teardown(async () => {
    await app.db
      .delete(affirmation)
      .where(eq(affirmation.userId, sampleUser.id));
    await app.db.delete(user).where(eq(user.id, sampleUser.id));
  });

  const payload = {
    content: faker.lorem.sentence(),
    category: "Mental and Emotional Wellness",
    background_file_name: faker.lorem.word(),
  };

  const response = await app
    .inject()
    .headers({ authorization: `Bearer ${token}` })
    .post("/affirmations")
    .payload(payload);

  const body = await response.json();

  const insertedAffirmation = await app.db.query.affirmation.findFirst({
    where: and(
      eq(affirmation.userId, sampleUser.id),
      eq(affirmation.id, body.id),
    ),
  });

  t.ok(insertedAffirmation);
  t.equal(response.statusCode, 201);
});

test("POST /affirmations should 401 status code if user is not authenticated", async (t) => {
  const app = await build(t);

  const payload = {
    content: faker.lorem.sentence(),
    category: faker.lorem.slug(),
    background_file_name: faker.lorem.word(),
  };

  const response = await app.inject().post("/affirmations").payload(payload);

  t.equal(response.statusCode, 401);
});
