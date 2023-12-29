import { test } from "tap";
import { build } from "../helper";
import { eq } from "drizzle-orm";
import { blacklistToken } from "../../src/schema";
import sinon from "sinon";
import * as authCode from "../../src/lib/auth";

test("should be able to logout a user given a token in req.headers.authorization", async (t) => {
  t.plan(3);
  // given
  const app = await build(t);
  const tokenText = "somethingRandom";

  // when
  const res = await app
    .inject()
    .post("/auth/logout")
    .headers({ Authorization: `Bearer ${tokenText}` });

  // then
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
  // given
  const app = await build(t);

  // when
  const res = await app.inject().post("/auth/forgotPin");

  // then
  t.equal(res.statusCode, 302);
});

// TODO: tighten the stubs
test("should ensure that user is sent a verification code if sent via email", async (t) => {
  t.plan(1);
  // given
  // @ts-ignore
  let sendCodeStub;
  t.before(() => {
    // @ts-ignore
    sendCodeStub = sinon.stub(authCode, "sendVerificationCode");
  });
  t.teardown(() => {
    // @ts-ignore
    sendCodeStub.restore();
  });
  // @ts-ignore
  sendCodeStub.returns(Promise.resolve({ success: true }));
  const app = await build(t);

  // when
  const res = await app.inject().post("/auth/forgot-pin").payload({
    username: "slilan@gmail.com",
  });

  const body = await res.json();

  t.match(body, { message: "successfuly sent code via email" });
});
