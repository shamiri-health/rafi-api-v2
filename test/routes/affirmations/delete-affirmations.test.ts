import { test } from "tap";
import { generateAffirmation } from "../../fixtures/affirmations";
import { user, affirmation } from "../../../src/database/schema";
import { generateUser } from "../../fixtures/users";
import { encodeAuthToken } from "../../../src/lib/utils/jwt";
import { build } from "../../helper";
import { eq } from "drizzle-orm";

test("DELETE /affirmations/:affirmatio_id should delete the current affirmation", async (t) => {
    // given
    const app = await build(t);
    const sampleUser = await generateUser(app.db);
    const sampleAffirmation = await generateAffirmation(app.db, sampleUser.id);
    const token = await encodeAuthToken(sampleUser.id, "user");

    t.teardown(async () => {
        await app.db.delete(affirmation).where(eq(affirmation.userId, sampleUser.id));
        await app.db.delete(user).where(eq(user.id, sampleUser.id));
    })
    // when
    const response = await app
    .inject()
    .headers({ authorization: `Bearer ${token}`})
    .delete(`/affirmations/${sampleAffirmation.id}`)

    // then
    t.equal(response.statusCode, 200);
})

test("DELETE /affirmations/:affirmation_id should return 401 when the user is not authenticated", async (t) => {
    // given
    const app = await build(t);
    const sampleUser = await generateUser(app.db);
    const sampleAffirmation = await generateAffirmation(app.db, sampleUser.id);

    t.teardown(async () => {
        await app.db.delete(affirmation).where(eq(affirmation.userId, sampleUser.id));
        await app.db.delete(user).where(eq(user.id, sampleUser.id));
    })

    // when
    const response = await app
    .inject()
    .delete(`/affirmations/${sampleAffirmation.id}`)

    // then
    t.equal(response.statusMessage, "Unauthorized");
    t.equal(response.statusCode, 401);
})
