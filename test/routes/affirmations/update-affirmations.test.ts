import { test } from "tap";
import { faker } from "@faker-js/faker";
import { build } from "../../helper";
import { generateAffirmation } from "../../fixtures/affirmations";
import { generateUser } from "../../fixtures/users";
import { encodeAuthToken } from "../../../src/lib/utils/jwt";
import { affirmation, user } from "../../../src/database/schema";
import { and, eq } from "drizzle-orm";

test("PUT /affirmations/:affirmation_id should update the current affirmation", async (t) => {
    // given
    const app = await build(t);
    const sampleUser = await generateUser(app.db);
    const token = await encodeAuthToken(sampleUser.id, "user");
    const sampleAffirmation = await generateAffirmation(app.db, sampleUser.id);

    t.teardown(async () => {
        await app.db.delete(affirmation).where(eq(affirmation.userId, sampleUser.id));
        await app.db.delete(user).where(eq(user.id, sampleUser.id));
    })

    // when
    const payload = {
        content: faker.lorem.sentence(),
        category: "Mental and Emotional Wellness",
        background_file_name: faker.lorem.word()
    }

    const response = await app
    .inject()
    .headers({ authorization: `Bearer ${token}`})
    .put(`/affirmations/${sampleAffirmation.id}`)
    .payload(payload)

    const updatedAffirmation = await app.db.query.affirmation.findFirst({
        where: and(
            eq(affirmation.userId, sampleUser.id),
            // @ts-ignore
            eq(affirmation.id, sampleAffirmation.id)
            )
        })
        
    // then
    t.equal(response.statusCode, 200);
    t.ok(updatedAffirmation);
    t.equal(updatedAffirmation.content, payload.content);
})

test("PUT /affirmations/:affirmation_id should return 401 when the user is not authenticated", async (t) => {
    const app = await build(t);
    const sampleUser = await generateUser(app.db);
    const sampleAffirmation = await generateAffirmation(app.db, sampleUser.id);

    t.teardown(async () => {
        await app.db.delete(affirmation).where(eq(affirmation.userId, sampleUser.id));
        await app.db.delete(user).where(eq(user.id, sampleUser.id));
    })

    const payload = {
        content: faker.lorem.sentence(),
        category: "Mental and Emotional Wellness",
        background_file_name: faker.lorem.word()
    }

    const response = await app
    .inject()
    .put(`/affirmations/${sampleAffirmation.id}`)
    .payload(payload)

    t.equal(response.statusMessage, "Unauthorized");
    t.equal(response.statusCode, 401);
})