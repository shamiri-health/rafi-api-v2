import { test } from "tap";
import { build } from "../../helper";
import { generateJournalEntry } from "../../fixtures/journals";
import { encodeAuthToken } from "../../../src/lib/utils/jwt";
import { generateUser } from "../../fixtures/users";
import { journal, user } from "../../../src/database/schema";
import { eq } from "drizzle-orm";

test("DELETE /journaling/:journal_id should delete the current journal entry", async (t) => {
  // given
  const app = await build(t);
  const sampleUser = await generateUser(app.db);
  const token = await encodeAuthToken(sampleUser.id, "user");
  const sampleJournalEntry = await generateJournalEntry(app.db, sampleUser.id);

  t.teardown(async () => {
    await app.db.delete(journal).where(eq(journal.id, sampleJournalEntry.id));
    await app.db.delete(user).where(eq(user.id, sampleUser.id));
  });

  // when
  const response = await app
    .inject()
    .headers({ authorization: `Bearer ${token}` })
    .delete(`/journaling/${sampleJournalEntry.id}`);

  // then
  t.equal(response.statusCode, 200);
});

test("DELETE /journaling/:journal_id should return 401 is user is not authenticated", async (t) => {
  // given
  const app = await build(t);
  const sampleUser = await generateUser(app.db);
  const sampleJournalEntry = await generateJournalEntry(app.db, sampleUser.id);

  t.teardown(async () => {
    await app.db.delete(journal).where(eq(journal.id, sampleJournalEntry.id));
    await app.db.delete(user).where(eq(user.id, sampleUser.id));
  });

  // when
  const response = await app
    .inject()
    .delete(`/journaling/${sampleJournalEntry.id}`);

  // then
  t.equal(response.statusMessage, "Unauthorized");
  t.equal(response.statusCode, 401);
});
