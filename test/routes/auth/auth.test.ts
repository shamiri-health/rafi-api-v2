import { test } from "tap";
import { build } from "../../helper";
import { eq } from "drizzle-orm";
import { blacklistToken, human, user } from "../../../src/database/schema";
import sinon from "sinon";
import * as authCode from "../../../src/lib/auth";
import { generateHuman, generateUser } from "../../fixtures/users";
import { faker } from "@faker-js/faker";

test("POST /auth/logout", (t) => {
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

test("POST /auth/forgotPin", (t) => {
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
test("POST /auth/forgot-pin", (t) => {
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

test("POST /auth/verify", (t) => {
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

test("POST /auth/token", async (t) => {
  // given
  const app = await build(t);

  t.test("should generate token if user exists in the database", async (t) => {
    // given
    const newHuman = await generateHuman(app.db);
    await generateUser(app.db, newHuman.id);

    t.teardown(async () => {
      await app.db.delete(user).where(eq(user.id, newHuman.id));
      await app.db.delete(human).where(eq(human.id, newHuman.id));
    });

    // when
    const res = await app
      .inject()
      .post("/auth/token")
      .payload({
        phoneNumber: newHuman.mobile,
        channel: "sms",
        confirmationCode: faker.string.alphanumeric({
          length: 6,
          casing: "upper",
        }),
      });
    const body = await res.json();

    // then
    t.equal(res.statusCode, 200);
    t.hasProps(body, ["token", "user", "authType"]);
  });

  t.test(
    "should return 404 error if user does not exist in the database",
    async (t) => {},
  );
  t.end();
});
