import { test } from "tap";
import { build } from "../../helper";
import { eq } from "drizzle-orm";
import { blacklistToken, human } from "../../../src/database/schema";
import sinon from "sinon";
import * as authCode from "../../../src/lib/auth";
import { generateHuman } from "../../fixtures/users";
import { faker } from "@faker-js/faker";

test("/logout", (t) => {
  t.test(
    "should be able to logout a user given a token in req.headers.authorization",
    async (t) => {
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
      t.match(JSON.parse(res.payload), {
        message: "successfully logged out user",
      });

      const dbResult = await app.db
        .select()
        .from(blacklistToken)
        .where(eq(blacklistToken.token, tokenText));

      t.equal(dbResult[0].token, tokenText);
      t.teardown(() => app.db.delete(blacklistToken));
    },
  );
  t.end();
});

test("/forgotPin", (t) => {
  t.test(
    "should be redirect the user from /forgotPin to /forgot-pin",
    async (t) => {
      // given
      const app = await build(t);

      // when
      const res = await app.inject().post("/auth/forgotPin");

      // then
      t.equal(res.statusCode, 302);
    },
  );
  t.end();
});

// TODO: tighten the stubs
test("/forgot-pin", (t) => {
  t.test(
    "should ensure that user is sent a verification code if sent via email",
    async (t) => {
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
    },
  );

  t.test(
    "should ensure that user is sent a verification code if sent via sms",
    async (t) => {
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
        username: "0712345678",
      });

      const body = await res.json();

      t.match(body, { message: "successfuly sent code via sms" });
    },
  );

  t.test(
    "should throw a 400 error if it's not a valid paramenter",
    async (t) => {
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
        username: "something random",
      });

      const body = await res.json();

      t.equal(400, res.statusCode);
      t.match(body, {
        message: "Please provide a valid email or a valid Kenyan Phonenumber",
      });
    },
  );

  t.end();
});

test("/auth/verify", (t) => {
  t.test(
    "should ensure that user is sent a verification code if email channel is provided",
    async (t) => {
      // given
      // @ts-ignore
      let sendCodeStub;
      t.before(() => {
        // @ts-ignore
        sendCodeStub = sinon.stub(authCode, "sendVerificationCode");
        sendCodeStub.returns(
          // @ts-ignore
          new Promise((resolve) => resolve({ success: true })),
        );
      });
      t.teardown(() => {
        // @ts-ignore
        sendCodeStub.restore();
      });
      // @ts-ignore
      const app = await build(t);
      const user = await generateHuman(app.db);

      t.teardown(() => {
        app.db.delete(human).where(eq(human.id, user.id));
      });

      // when
      const res = await app.inject().post("/auth/verify").payload({
        email: user.email,
        channel: "email",
      });
      const body = await res.json();

      // then
      // @ts-ignore
      t.match(body, { message: "Verification token sent successfully" });
      t.equal(res.statusCode, 200);
    },
  );

  t.test(
    "should ensure that user is sent a verification code if sms channel and 'phone_number' is provided",
    async (t) => {
      // given
      // @ts-ignore
      let sendCodeStub;
      t.before(() => {
        // @ts-ignore
        sendCodeStub = sinon.stub(authCode, "sendVerificationCode");
        sendCodeStub.returns(
          // @ts-ignore
          new Promise((resolve) => resolve({ success: true })),
        );
      });
      t.teardown(() => {
        // @ts-ignore
        sendCodeStub.restore();
      });
      // @ts-ignore
      const app = await build(t);
      const user = await generateHuman(app.db);

      t.teardown(() => {
        app.db.delete(human).where(eq(human.id, user.id));
      });

      // when
      const res = await app.inject().post("/auth/verify").payload({
        phone_number: user.mobile,
        channel: "sms",
      });
      const body = await res.json();

      // then
      // @ts-ignore
      t.match(body, { message: "Verification token sent successfully" });
      t.equal(res.statusCode, 200);
    },
  );

  t.test(
    "should ensure that user is sent a verification code if sms channel and 'phoneNumber' is provided",
    async (t) => {
      // given
      // @ts-ignore
      let sendCodeStub;
      t.before(() => {
        // @ts-ignore
        sendCodeStub = sinon.stub(authCode, "sendVerificationCode");
        sendCodeStub.returns(
          // @ts-ignore
          new Promise((resolve) => resolve({ success: true })),
        );
      });

      // @ts-ignore
      const app = await build(t);
      const user = await generateHuman(app.db);

      t.teardown(async () => {
        await app.db.delete(human).where(eq(human.id, user.id));
      });

      // when
      const res = await app.inject().post("/auth/verify").payload({
        phoneNumber: user.mobile,
        channel: "sms",
      });
      const body = await res.json();

      // then
      // @ts-ignore
      t.match(body, { message: "Verification token sent successfully" });
      t.equal(res.statusCode, 200);
    },
  );

  t.test("should fail if channel is not specified", async (t) => {
    // given
    const app = await build(t);

    // when
    const res = await app.inject().post("/auth/verify").payload({
      phoneNumber: faker.phone.number(),
    });

    // then
    t.equal(res.statusCode, 400);
  });

  t.test(
    "should fail if channel is sms and phoneNumber is not specified",
    async (t) => {
      // given
      const app = await build(t);

      // when
      const res = await app.inject().post("/auth/verify").payload({
        channel: "sms",
      });

      // then
      t.equal(res.statusCode, 400);
    },
  );

  t.test(
    "should fail if channel is email and email is not specified",
    async (t) => {
      // given
      // @ts-ignore
      const app = await build(t);

      // when
      const res = await app.inject().post("/auth/verify").payload({
        channel: "email",
      });

      // then
      t.equal(res.statusCode, 400);
    },
  );

  /* REVIEW IF THIS IS NEEDED
  t.test("should fail if channel is sms and phone number is invalid", async (t) => {
    // given
    // @ts-ignore
    let sendCodeStub;
    t.before(() => {
      // @ts-ignore
      sendCodeStub = sinon.stub(authCode, "sendVerificationCode");
      // @ts-ignore
      sendCodeStub.returns(new Promise((resolve) => resolve({ success: true })));
    });
    t.teardown(() => {
      // @ts-ignore
      sendCodeStub.restore();
    });
    // @ts-ignore
    const app = await build(t);

    // when
    const res = await app.inject().post("/auth/verify").payload({
      channel: "sms",
      phoneNumber: "11111111111111"
    });

    // then
    t.equal(res.statusCode, 400);
  });
  */

  t.end();
});
