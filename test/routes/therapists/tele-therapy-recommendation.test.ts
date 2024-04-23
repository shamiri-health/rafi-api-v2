import { test } from "tap";
import { eq, and, isNull } from "drizzle-orm";
import { build } from "../../helper";
import { generateUser } from "../../fixtures/users";
import { encodeAuthToken } from "../../../src/lib/utils/jwt";
import { generatePhoneEvent } from "../../fixtures/therapySession";
import { phoneEvent, therapySession, user } from "../../../src/database/schema";

const sampleTherapistId = 1;
test("POST /therapists/assignment should recommend a teletherapy session", async (t) => {
  const app = await build(t);
  const sampleUser = await generateUser(app.db);
  const token = await encodeAuthToken(sampleUser.id, "user");
  const samplePhoneEvent = await generatePhoneEvent(
    app.db,
    sampleUser.id,
    sampleTherapistId,
  );
  const sampleEventId = samplePhoneEvent.id;
  
  t.teardown(async () => {
    await app.db.delete(phoneEvent).where(eq(phoneEvent.id, sampleEventId));
    await app.db
      .delete(therapySession)
      .where(eq(therapySession.id, sampleEventId));
    await app.db.delete(user).where(eq(user.id, sampleUser.id));
  });

  const payload = {
    userId: sampleUser.id,
    therapistRecommendation: sampleTherapistId,
    eventId: sampleEventId,
  };
  
  const response = await app
  .inject()
  .headers({ authorization: `Bearer ${token}` })
  .post("/therapists/assignment")
  .payload(payload);

  const recommendedSession = await app.db.query.therapySession.findFirst({
    where: and(
      eq(therapySession.userId, sampleUser.id),
      eq(therapySession.type, "phoneEvent"),
      isNull(therapySession.completeDatetime),
    ),
  });

  t.equal(response.statusCode, 201);
  t.ok(recommendedSession)
});

test("POST /therapists/assignment should return 401 if unauthorized", async (t) => {
  const app = await build(t);
  const sampleUser = await generateUser(app.db);
  const samplePhoneEvent = await generatePhoneEvent(
    app.db,
    sampleUser.id,
    sampleTherapistId,
  );
  const sampleEventId = samplePhoneEvent.id;

  t.teardown(async () => {
    await app.db.delete(phoneEvent).where(eq(phoneEvent.id, sampleEventId));
    await app.db
      .delete(therapySession)
      .where(eq(therapySession.id, sampleEventId));
    await app.db.delete(user).where(eq(user.id, sampleUser.id));
  });

  const payload = {
    userId: sampleUser.id,
    therapistRecommendation: "10",
    eventId: sampleEventId,
  };

  const response = await app
    .inject()
    .headers()
    .post("/therapists/assignment")
    .payload(payload);

  t.equal(response.statusCode, 401);
});
