import { test } from "tap"
import { build } from "../../helper";
import { generateHuman } from "../../fixtures/users";
import { faker } from "@faker-js/faker";
import { human } from "../../../src/database/schema";
import { eq } from "drizzle-orm";

test("/auth/create-user", (t) => {
  t.skip("should create user given valid request body", async (t) => {
    // given

    // when

    // then
    // 1. assert api response
    // 2. assert database records
    // 3. assert that sms was "sent"
    // 4. assert that user was "added" to stream

    // teardown
  })

  t.test("should return a 400 error if a user with supplied email already exists", async (t) => {
    // given
    const app = await build(t);
    const existingHuman = await generateHuman(app.db)

    t.teardown(async () => {
      await app.db.delete(human).where(eq(human.id, existingHuman.id))
    })

    const body = {
      birth_date: "2023-12-29",
      education_level: "Primary School",
      email: existingHuman.email,
      gender: "MALE",
      phone_number: faker.string.numeric({ length: 9 }),
      profession: "Computer and Mathematical",
      referral_code: "CHRX9N"
    }

    // when
    const res = await app.inject().post('/auth/create-user').payload(body)
    const resBody = await res.json()

    // then
    t.equal(resBody.message, 'A user exists with the supplied email')
    t.equal(res.statusCode, 400)
  })

  t.skip("should return a 400 error if a user with supplied phonenumber already exists", async (t) => {
    // given

    // when

    // then

  })

  t.end()
})
