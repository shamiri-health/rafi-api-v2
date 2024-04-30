import { test } from "tap";
import { eq, isNull, and } from "drizzle-orm";
import { build } from "../../helper";
import { generateUser } from "../../fixtures/users";
import { encodeAuthToken } from "../../../src/lib/utils/jwt";
import {
  onsiteEvent,
  therapySession,
  user,
} from "../../../src/database/schema";
import { generateOnsiteEvent } from "../../fixtures/therapySession";

const sampleTherapistId = 1;
test("POST /therapists/assignment should recommend a onsite event", async (t) => {
  const app = await build(t);
  const sampleUser = await generateUser(app.db);
  const token = await encodeAuthToken(sampleUser.id, "user");
  const sampleOnsiteEvent = await generateOnsiteEvent(
    app.db,
    sampleUser.id,
    sampleTherapistId,
  );
  const sampleEventId = sampleOnsiteEvent.id;

  t.teardown(async () => {
    await app.db.delete(onsiteEvent).where(eq(onsiteEvent.id, sampleEventId));
    await app.db
      .delete(therapySession)
      .where(eq(therapySession.id, sampleEventId));
    await app.db.delete(user).where(eq(user.id, sampleUser.id));
  });

  const payload = {
    eventId: sampleEventId,
    userId: sampleUser.id,
    therapistRecommendation: sampleTherapistId,
  };

  const response = await app
    .inject()
    .headers({ authorization: `bearer ${token}` })
    .post("/therapists/assignment")
    .payload(payload);

  const recommendedOnsiteEvent = await app.db.query.therapySession.findFirst({
    where: and(
      eq(therapySession.userId, sampleUser.id),
      eq(therapySession.type, "onsiteEvent"),
      isNull(therapySession.completeDatetime),
    ),
  });

  t.equal(response.statusCode, 201);
  t.ok(recommendedOnsiteEvent);
});

test("POST /therapists/assignment should return 401 if unauthorized", async (t) => {
  const app = await build(t);
  const sampleUser = await generateUser(app.db);
  const sampleOnsiteEvent = await generateOnsiteEvent(
    app.db,
    sampleUser.id,
    sampleTherapistId,
  );
  const sampleEventId = sampleOnsiteEvent.id;

  t.teardown(async () => {
    await app.db.delete(onsiteEvent).where(eq(onsiteEvent.id, sampleEventId));
    await app.db
      .delete(therapySession)
      .where(eq(therapySession.id, sampleEventId));
    await app.db.delete(user).where(eq(user.id, sampleUser.id));
  });

  const payload = {
    eventId: sampleEventId,
    userId: sampleUser.id,
    therapistRecommendation: sampleTherapistId,
  };

  const response = await app
    .inject()
    .post("/therapists/assignment")
    .payload(payload);

  t.equal(response.statusCode, 401);
});
