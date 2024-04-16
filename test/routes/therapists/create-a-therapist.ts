import { test } from "tap";
import { eq } from "drizzle-orm";
import { faker } from "@faker-js/faker";

import { build } from "../../helper";
import { encodeAuthToken } from "../../../src/lib/utils/jwt";
import { generateUser } from "../../fixtures/users";
import { therapist, user } from "../../../src/database/schema";

test("POST /therapists should create a new therapist", async (t) => {
    const app = await build(t);
    const sampleUser = await generateUser(app.db);
    const token = await encodeAuthToken(sampleUser.id, "user");

    t.teardown(async () => {
        await app.db.delete(user).where(eq(user.id, sampleUser.id));
    })

    const payload = {
        name: faker.person.firstName(),
        clinicalLevel: 2,
        supportPhone: true,
        supportInPerson: true,
        gmail: `${faker.lorem.word()}@gmail.com`,
        about: faker.person.jobTitle(),
        summary: faker.person.jobDescriptor(),
        timeZone: "Africa/Nairobi",
        workingTimeEnd: faker.date.anytime(),
        workingTimeStart: faker.date.anytime(),
        specialtyTags: faker.lorem.word(),
        dateOfBirth: faker.date.birthdate(),
        clientId: faker.number.int(),
        photoUrl: faker.lorem.word()
    }

    const response = await app
    .inject()
    .headers({ authorization: `bearer ${token}`})
    .post("/therapists")
    .payload(payload)

    const body = await response.json();
    const createdTherapist = await app.db.query.therapist.findFirst({
        where: eq(therapist.id, body.id)
    })

    t.ok(createdTherapist)
})