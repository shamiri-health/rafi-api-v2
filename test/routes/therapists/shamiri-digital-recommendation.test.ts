import { test } from "tap";
import { eq } from "drizzle-orm";
import { build } from "../../helper";
import { generateUser } from "../../fixtures/users";
import { encodeAuthToken } from "../../../src/lib/utils/jwt";
import { cbtEvent, therapySession, user } from "../../../src/database/schema";
import { generateShamiriDigitalEvent } from "../../fixtures/therapySession";

test("POST /therapist/assignment should recommend a cbt Event", async (t) => {
  const app = await build(t);
  const sampleUser = await generateUser(app.db);
  const token = await encodeAuthToken(sampleUser.id, "user");
  const sampleTopicId = 1;
  const sampleCBTEvent = await generateShamiriDigitalEvent(
    app.db,
    sampleUser.id,
    sampleTopicId,
  );
  const sampleEventId = sampleCBTEvent.id;

  t.teardown(async () => {
    await app.db.delete(cbtEvent).where(eq(cbtEvent.id, sampleEventId));
    await app.db
      .delete(therapySession)
      .where(eq(therapySession.id, sampleEventId));
    await app.db.delete(user).where(eq(user.id, sampleUser.id));
  });

  const payload = {
    eventId: sampleEventId,
    userId: sampleUser.id,
    shamiriDigitalRecommendation: "1",
  };

  const response = await app
    .inject()
    .headers({ authorization: `bearer ${token}` })
    .post("/therapists/assignment")
    .payload(payload);

  const recommendedCBTEvent = await app.db.query.cbtEvent.findFirst({
    where: eq(
      cbtEvent.cbtCourseId,
      parseInt(payload.shamiriDigitalRecommendation),
    ),
  });

  t.equal(response.statusCode, 201);
  t.ok(recommendedCBTEvent);
});

test("POST /therapist/assignment should return a 401 if unauthorized", async (t) => {
  const app = await build(t);
  const sampleUser = await generateUser(app.db);
  const sampleTopicId = 1;
  const sampleCBTEvent = await generateShamiriDigitalEvent(
    app.db,
    sampleUser.id,
    sampleTopicId,
  );
  const sampleEventId = sampleCBTEvent.id;

  t.teardown(async () => {
    await app.db.delete(cbtEvent).where(eq(cbtEvent.id, sampleEventId));
    await app.db
      .delete(therapySession)
      .where(eq(therapySession.id, sampleEventId));
    await app.db.delete(user).where(eq(user.id, sampleUser.id));
  });

  const payload = {
    eventId: sampleEventId,
    userId: sampleUser.id,
    shamiriDigitalRecommendation: "1",
  };

  const response = await app
    .inject()
    .post("/therapists/assignment")
    .payload(payload);

  t.equal(response.statusCode, 401);
});
