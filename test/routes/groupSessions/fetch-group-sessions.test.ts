import { test } from "tap";
import { build } from "../../helper";
import { generateUser } from "../../fixtures/users";
import { encodeAuthToken } from "../../../src/lib/utils/jwt";
import { generateGroupSession } from "../../fixtures/groupSessions";
import { groupSession, groupTopic, user } from "../../../src/database/schema";
import { eq } from "drizzle-orm";

test("GET /groupSessions should return a list of group sessions if available", async (t) => {
  const app = await build(t);
  const sampleUser = await generateUser(app.db);
  const token = await encodeAuthToken(sampleUser.id, "user");
  const sampleGroupSession = await generateGroupSession(app.db);
  const sampleGroupTopicId = sampleGroupSession.groupTopicId;

  t.teardown(async () => {
    await app.db.delete(groupSession).where(eq(groupSession.id, sampleGroupSession.id));
    // @ts-ignore
    await app.db.delete(groupTopic).where(eq(groupTopic.id, sampleGroupTopicId));
    await app.db.delete(user).where(eq(user.id, sampleUser.id));
  })

  const response = await app
    .inject()
    .headers({ authorization: `bearer ${token}` })
    .get("/groupSessions");
    
  const body = await response.json();
  // @ts-ignore
  const targetSession = body.find(session => session.id === sampleGroupSession.id);
    
  t.equal(response.statusCode, 200);
  t.equal(targetSession.groupTopic.id, sampleGroupSession.groupTopicId);
});

test("GET /groupSessions should return 401 if the user is unauthorized", async (t) => {
  const app = await build(t);

  const response = await app.inject().get("/groupSessions");

  t.equal(response.statusCode, 401);
});
