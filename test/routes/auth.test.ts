import { test } from "tap";
import { build } from "../helper";
import { eq } from "drizzle-orm";
import { blacklistToken } from "../../src/schema";

test("should be able to logout a user given a token in req.headers.authroziation", async (t) => {
  const app = await build(t);

  const res = await app
    .inject()
    .post("/auth/logout")
    .headers({ Authorization: "Bearer someRandomStuff " });

  t.equal(res.status, 200);
  t.equal(res.body, { message: "sucessfully logged out user" });

  const dbResult = await app.db
    .select()
    .from(blacklistToken)
    .where(eq(blacklistToken.token, "someRandomStuff"));

  t.strictSame(dbResult[0].token, "somRandomStuff");
});
