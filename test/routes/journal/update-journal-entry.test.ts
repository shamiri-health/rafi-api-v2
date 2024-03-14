import { test } from "tap";
import { eq, and } from "drizzle-orm";
import { build } from "../../helper";
import { encodeAuthToken } from "../../../src/lib/utils/jwt";
import { journal, user } from "../../../src/database/schema";
import { generateUser } from "../../fixtures/users";
import { generateJournalEntry } from "../../fixtures/journals";

test("PUT /journaling/:journal_id should update the current journal entry", async (t) => {
    // given
    const app = await build(t);
    const sampleUser = await generateUser(app.db);
    const token = await encodeAuthToken(sampleUser.id, "user");
    const sampleJournalEntry = await generateJournalEntry(app.db, sampleUser.id);

    t.teardown(async () => {
        await app.db.delete(journal).where(eq(journal.userId, sampleUser.id));
        await app.db.delete(user).where(eq(user.id, sampleUser.id));
    })

    const payload = {
        question_1: "Oyaaaaaaa",
        content_1: "Halooo"
    };

    // when
    const response = await app
    .inject()
    .headers({ authorization: `Bearer ${token}`})
    .put(`/journaling/${sampleJournalEntry.id}`)
    .payload(payload)    

    const body = await response.json();

    // then
    const updatedJournalEntry = await app.db.query.journal.findFirst({
        where: and(
            eq(journal.userId, sampleUser.id),
            eq(journal.id, body.id)
        )
    })
    
    t.equal(response.statusCode, 200);
    t.ok(updatedJournalEntry);
 })

 test("PUT /journaling/:journal_id should 401 if the user is not authenticated", async (t) => {
    // given
    const app = await build(t);
    const sampleUser = await generateUser(app.db);
    const sampleJournalEntry = await generateJournalEntry(app.db, sampleUser.id);

    const payload = {
        question_1: "Oyaaaaaaa",
        content_1: "Halooo"
    };

    // when
    const response = await app
    .inject()
    .put(`/journaling/${sampleJournalEntry.id}`)
    .payload(payload);

    // then
    t.equal(response.statusMessage, "Unauthorized");
    t.equal(response.statusCode, 401);
 })