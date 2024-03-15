import { test } from "tap";
import { eq } from "drizzle-orm";
import { generateUser } from "../../fixtures/users";
import { build } from "../../helper";
import { favouritedAffirmation, user } from "../../../src/database/schema";
import { encodeAuthToken } from "../../../src/lib/utils/jwt";
import { generateFavouriteAffirmation } from "../../fixtures/affirmations";

test("DELETE /favourite-affirmations/:affirmation_id should remove the selected affirmation", async (t) => {
    const app = await build(t);
    const sampleUser = await generateUser(app.db);
    const token = await encodeAuthToken(sampleUser.id, "user");
    const favoriteAffirmation = await generateFavouriteAffirmation(app.db, sampleUser.id);

    t.teardown(async () => {
        await app.db.delete(favouritedAffirmation).where(eq(favouritedAffirmation.userId, sampleUser.id));
        await app.db.delete(user).where(eq(user.id, sampleUser.id));
    })

    const response = await app
    .inject()
    .headers({ authorization: `Bearer ${token}`})
    .delete(`/favourite-affirmations/${favoriteAffirmation.id}`)

    t.equal(response.statusCode, 200);
})

test("DELETE /favourite-affirmations/affirmation_id should return 401 is user is not authenticated", async (t) => {
    const app = await build(t);
    const sampleUser = await generateUser(app.db);
    const favoriteAffirmation = await generateFavouriteAffirmation(app.db, sampleUser.id);

    t.teardown(async () => {
        await app.db.delete(favouritedAffirmation).where(eq(favouritedAffirmation.userId, sampleUser.id));
        await app.db.delete(user).where(eq(user.id, sampleUser.id));
    })

    const response = await app
    .inject()
    .delete(`/favourite-affirmations/${favoriteAffirmation.id}`)

    t.equal(response.statusCode, 401);
})