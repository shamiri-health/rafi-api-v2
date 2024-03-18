import { test } from "tap";
import { and, eq } from "drizzle-orm";
import { faker } from "@faker-js/faker";
import { generateUser } from "../../fixtures/users";
import { encodeAuthToken } from "../../../src/lib/utils/jwt";
import { build } from "../../helper";
import { favouritedAffirmation, user } from "../../../src/database/schema";

test("POST /favourite-affirmations should add favourite affirmations", async (t) => {
  const app = await build(t);
  const sampleUser = await generateUser(app.db);
  const token = await encodeAuthToken(sampleUser.id, "user");

  t.teardown(async () => {
    await app.db
      .delete(favouritedAffirmation)
      .where(eq(favouritedAffirmation.userId, sampleUser.id));
    await app.db.delete(user).where(eq(user.id, sampleUser.id));
  });

  const payload = {
    category: faker.lorem.slug(),
  };

  const response = await app
    .inject()
    .headers({ authorization: `Bearer ${token}` })
    .post("/favourite-affirmations/")
    .payload(payload);

  const result = await response.json();

  const favouriteAffirmation =
    await app.db.query.favouritedAffirmation.findFirst({
      where: and(
        eq(favouritedAffirmation.userId, sampleUser.id),
        eq(favouritedAffirmation.id, result.id),
      ),
    });

  t.ok(favouriteAffirmation);
  t.equal(response.statusCode, 201);
});

test("/POST /favourite-affirmations should return 401 if the user is not authenticated", async (t) => {
  const app = await build(t);
  const sampleUser = await generateUser(app.db);

  t.teardown(async () => {
    await app.db
      .delete(favouritedAffirmation)
      .where(eq(favouritedAffirmation.userId, sampleUser.id));
    await app.db.delete(user).where(eq(user.id, sampleUser.id));
  });

  const payload = {
    category: faker.lorem.slug(),
  };

  const response = await app
    .inject()
    .post("/favourite-affirmations/")
    .payload(payload);

  t.equal(response.statusCode, 401);
});
