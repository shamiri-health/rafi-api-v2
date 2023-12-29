import { test } from "tap";
import { build } from "../helper";
import { eq } from "drizzle-orm";
import { blacklistToken } from "../../src/schema";

test("should be able to logout a user given a token in req.headers.authorization", async (t) => {
  t.plan(3);
  const app = await build(t);

  const tokenText = "somethingRandom";

  const res = await app
    .inject()
    .post("/auth/logout")
    .headers({ Authorization: `Bearer ${tokenText}` });

  t.equal(res.statusCode, 200);
  t.match(JSON.parse(res.payload), { message: "successfully logged out user" });

  const dbResult = await app.db
    .select()
    .from(blacklistToken)
    .where(eq(blacklistToken.token, tokenText));

  t.equal(dbResult[0].token, tokenText);
  t.teardown(() => app.db.delete(blacklistToken));
});

test("should be redirect the user from /forgotPin to /forgot-pin", async (t) => {
  const app = await build(t);

  const res = await app.inject().post("/auth/forgotPin");

  t.equal(res.statusCode, 302);
});
