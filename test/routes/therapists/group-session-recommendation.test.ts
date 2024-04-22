import { test } from "tap";
import { eq, and, isNull } from "drizzle-orm";
import { build } from "../../helper";
import { generateUser } from "../../fixtures/users";
import { encodeAuthToken } from "../../../src/lib/utils/jwt";
import { generateGroupEvent } from "../../fixtures/therapySession";
import { groupEvent, user, therapySession } from "../../../src/database/schema";

test("POST /therapists/assignment should recommend a group event", async (t) => {
    const app = await build(t);
    const sampleUser = await generateUser(app.db);
    const token = await encodeAuthToken(sampleUser.id, "user");
    const sampleTopicId = 1;
    const sampleGroupEvent = await generateGroupEvent(app.db, sampleUser.id, sampleTopicId);
    const sampleEventId = sampleGroupEvent.id;

    t.teardown(async () => {
        await app.db.delete(groupEvent).where(eq(groupEvent.id, sampleEventId));
        await app.db.delete(therapySession).where(eq(therapySession.id, sampleEventId))
        await app.db.delete(user).where(eq(user.id, sampleUser.id));
    })

    // Generate sample group topic
    const payload = {
        eventId: sampleEventId,
        userId: sampleUser.id,
        groupTherapyRecommendation: "1"
    }

    const response = await app
    .inject()
    .headers({ authorization: `bearer ${token}`})
    .post("/therapists/assignment")
    .payload(payload)

    const recommendedGroupEvent = await app.db.query.therapySession.findFirst({
        where: and(
            eq(therapySession.type, "groupEvent"),
            eq(therapySession.userId, sampleUser.id),
            isNull(therapySession.completeDatetime)
        )
    })
    
    t.equal(response.statusCode, 201);
    t.ok(recommendedGroupEvent);
})

test("POST /therapists/assignment should return 401 if unauthorized", async (t) => {
    const app = await build(t);
    const sampleUser = await generateUser(app.db);
    const sampleTopicId = 1;
    const sampleGroupEvent = await generateGroupEvent(app.db, sampleUser.id, sampleTopicId);
    const sampleEventId = sampleGroupEvent.id;

    t.teardown(async () => {
        await app.db.delete(groupEvent).where(eq(groupEvent.id, sampleEventId));
        await app.db.delete(therapySession).where(eq(therapySession.id, sampleEventId))
        await app.db.delete(user).where(eq(user.id, sampleUser.id));
    })

    // Generate sample group topic
    const payload = {
        eventId: sampleEventId,
        userId: sampleUser.id,
        groupTherapyRecommendation: "1"
    }

    const response = await app
    .inject()
    .post("/therapists/assignment")
    .payload(payload)

    t.equal(response.statusCode, 401);
})