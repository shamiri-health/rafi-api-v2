import { test } from "tap";
import { build } from "../../helper";
import { generateHuman } from "../../fixtures/users";
import { faker } from "@faker-js/faker";
import {
  human,
  user,
  userService,
  userGoal,
  rewardHubRecord,
  userRewardHub,
} from "../../../src/database/schema";
import { eq } from "drizzle-orm";
import sinon from "sinon";

import * as verificationClient from "../../../src/lib/auth";
import * as streamClient from "../../../src/lib/stream";
import { userAchievement } from "../../../src/schema";

test("/auth/create-user", (t) => {
  t.skip("should create user given valid request body", async (t) => {
    // @ts-ignore
    let streamStub;
    // @ts-ignore
    let sendCodeStub;
    t.before(() => {
      sendCodeStub = sinon.stub(verificationClient, "sendVerificationCode");
      streamStub = sinon.stub(streamClient, "addUserToStream");
    });
    t.teardown(() => {
      // @ts-ignore
      sendCodeStub.restore();
      // @ts-ignore
      streamStub.restore();
    });
    // @ts-ignore
    sendCodeStub.returns(Promise.resolve({ success: true }));
    // @ts-ignore
    streamStub.returns(Promise.resolve({ success: true }));

    // given
    const app = await build(t);
    const payload = {
      birth_date: "2023-12-29",
      education_level: "Primary School",
      email: faker.internet.email().trim().toLowerCase(),
      gender: "MALE",
      phone_number: faker.string.numeric({ length: 9 }),
      profession: "Computer and Mathematical",
      // referral_code: "CHRX9N"
    };

    // when
    const res = await app.inject().post("/auth/create-user").payload(payload);
    // const body = await res.json();

    // then
    t.equal(res.statusCode, 201);
    // 1. assert api response
    // 2. assert database records
    // 3. assert that sms was "sent"
    // 4. assert that user was "added" to stream

    t.teardown(() => {
      Promise.all([
        app.db.delete(userService),
        app.db.delete(userGoal),
        app.db.delete(userAchievement),
        app.db.delete(rewardHubRecord),
        app.db.delete(userRewardHub),
        app.db.delete(user),
        app.db.delete(human),
      ]);
    });
  });

  t.test(
    "should return a 400 error if a user with supplied email already exists",
    async (t) => {
      // given
      const app = await build(t);
      const existingHuman = await generateHuman(app.db);

      t.teardown(() => {
        app.db.delete(human).where(eq(human.id, existingHuman.id));
      });

      const body = {
        birth_date: "2023-12-29",
        education_level: "Primary School",
        email: existingHuman.email,
        gender: "MALE",
        phone_number: faker.string.numeric({ length: 9 }),
        profession: "Computer and Mathematical",
        referral_code: "CHRX9N",
      };

      // when
      const res = await app.inject().post("/auth/create-user").payload(body);
      const resBody = await res.json();

      // then
      t.equal(resBody.message, "A user exists with the supplied email");
      t.equal(res.statusCode, 400);
    },
  );

  t.test(
    "should return a 400 error if a user with supplied phonenumber already exists",
    async (t) => {
      // given
      const app = await build(t);
      const existingHuman = await generateHuman(app.db);

      t.teardown(() => {
        app.db.delete(human).where(eq(human.id, existingHuman.id));
      });

      const body = {
        birth_date: "2023-12-29",
        education_level: "Primary School",
        email: faker.internet.email().trim().toLowerCase(),
        gender: "MALE",
        phone_number: existingHuman.mobile,
        profession: "Computer and Mathematical",
        referral_code: "CHRX9N",
      };

      // when
      const res = await app.inject().post("/auth/create-user").payload(body);
      const resBody = await res.json();

      // then
      t.equal(resBody.message, "A user exists with the supplied phone");
      t.equal(res.statusCode, 400);
    },
  );

  t.end();
});
