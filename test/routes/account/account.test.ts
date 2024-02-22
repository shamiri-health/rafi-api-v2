import { generateUser } from "../../fixtures/users";
import { build } from "../../helper";
import { test } from "tap";
import { human, user } from "../../../src/database/schema";
import { eq } from "drizzle-orm";

test("PUT /account/profile", async (t) => {
  const app = await build(t);
  // given
  const sampleUser = await generateUser(app.db);

  t.teardown(async () => {
    await app.db.delete(user).where(eq(user.id, sampleUser.id));
    await app.db.delete(human).where(eq(human.id, sampleUser.id));
  });

  t.test(
    "should update the user's profile given a correct payload",
    async (t) => {
      // given
      const payload = {
        alias: "something random",
        avatarId: 1,
      };

      // when
      const res = await app.inject().put("/account/profile").payload(payload);
      const body = await res.json();

      // then
      t.equal(res.statusCode, 200);
      t.equal(body.alias, payload.alias);
      t.equal(body.avatarId, payload.avatarId);
    },
  );

  t.test(
    "should not update the user's profile if the alias is taken",
    async (t) => {
      const payload = {
        alias: sampleUser.alias,
      };

      // when
      const res = await app.inject().put("/account/profile").payload(payload);

      // then
      t.equal(res.statusCode, 400);

      const userRecord = await app.db.query.user.findFirst({
        where: eq(user.id, sampleUser.id),
      });

      t.equal(userRecord.alias, sampleUser.alias);
    },
  );
});
