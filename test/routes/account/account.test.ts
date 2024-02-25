import { generateUser } from "../../fixtures/users";
import { build } from "../../helper";
import { test } from "tap";
import { human, user } from "../../../src/database/schema";
import { eq } from "drizzle-orm";
import { encodeAuthToken } from "../../../src/lib/utils/jwt";

test('PUT /account/profile', async (t) => {
  const app = await build(t);
  const sampleUser = await generateUser(app.db);
  const token = encodeAuthToken(sampleUser.id, 'user')

  t.teardown(async () => {
    console.log('already being called')
    await app.db.delete(user).where(eq(user.id, sampleUser.id))
    await app.db.delete(human).where(eq(human.id, sampleUser.id))
  })

  t.test("PUT /account/profile should update the user's profile given a correct payload", async (t) => {
    // given
    const payload = {
      alias: "something random",
      avatarId: 1,
    };

    // when
    const res = await app.inject().put("/account/profile").headers({ authorization: `Bearer ${token}` }).payload(payload);
    const body = await res.json();

    // then
    t.equal(res.statusCode, 200);
    t.equal(body.alias, payload.alias);
    t.equal(body.avatarId, payload.avatarId);
  });

  t.test("PUT /account/profile should not update the user's profile if the alias is taken", async (t) => {
    // given
    const payload = {
      alias: sampleUser.alias,
    };

    console.log(sampleUser)
    console.log(payload)
    // when
    const res = await app.inject().put("/account/profile").headers({ authorization: `Bearer ${token}` }).payload(payload);
    console.log('done testing this thing')

    // then
    t.equal(res.statusCode, 400)
  });

  t.end();
});
