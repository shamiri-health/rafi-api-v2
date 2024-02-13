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
  therapist,
  subscription,
  userAchievement,
} from "../../../src/database/schema";
import { eq, inArray } from "drizzle-orm";
import sinon from "sinon";

import * as verificationClient from "../../../src/lib/auth";
import * as streamClient from "../../../src/lib/stream";

test("/auth/create-user", async (t) => {
  // given
  const app = await build(t);
  // @ts-ignore
  let streamStub;
  // @ts-ignore
  let sendCodeStub;
  t.before(async () => {
    sendCodeStub = sinon.stub(verificationClient, "sendVerificationCode");
    streamStub = sinon.stub(streamClient, "addUserToStream");

    // @ts-ignore
    sendCodeStub.returns(Promise.resolve({ success: true }));
    // @ts-ignore
    streamStub.returns(Promise.resolve({ success: true }));

    // given
    const emails = [faker.internet.email(), faker.internet.email()];
    await app.db
      .insert(human)
      .values([
        {
          id: 205,
          mobile: faker.phone.number(),
          email: emails[0],
        },
        {
          id: 10,
          mobile: faker.phone.number(),
          email: emails[1],
        },
      ])
      .onConflictDoNothing({ target: human.id });

    await app.db
      .insert(therapist)
      .values([
        {
          id: 205,
          gmail: emails[0],
          dateOfBirth: new Date(),
        },
        { id: 10, gmail: emails[1], dateOfBirth: new Date() },
      ])
      .onConflictDoNothing({ target: therapist.id });
  });

  t.teardown(async () => {
    // @ts-ignore
    sendCodeStub.restore();
    // @ts-ignore
    streamStub.restore();
    await app.db.delete(therapist).where(inArray(therapist.id, [10, 205]));
  });

  t.test("should create user given valid request body", async (t) => {
    // given

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
    const body = await res.json();

    // then
    t.equal(res.statusCode, 201);
    // 1. assert api response
    // 2. assert database records
    // 3. assert that sms was "sent"
    // 4. assert that user was "added" to stream

    t.teardown(async () => {
      await app.db.delete(subscription);
      await app.db.delete(userService);
      await app.db.delete(userGoal);
      await app.db.delete(userAchievement);
      await app.db.delete(rewardHubRecord);
      await app.db.delete(userRewardHub);
      await app.db.delete(user).where(eq(user.id, body.id));
      await app.db.delete(human).where(eq(human.id, body.id));
    });
  });

  t.test(
    "should return a 400 error if a user with supplied email already exists",
    async (t) => {
      // given
      const existingHuman = await generateHuman(app.db);

      t.teardown(async () => {
        await app.db.delete(human).where(eq(human.id, existingHuman.id));
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
