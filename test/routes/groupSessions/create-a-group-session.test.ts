import { test } from "tap";
import { build } from "../../helper";
import { generateUser } from "../../fixtures/users";
import { generateTherapist } from "../../fixtures/users";
import { encodeAuthToken } from "../../../src/lib/utils/jwt";
import { groupSession, therapist, user } from "../../../src/database/schema";
import { and, eq, sql } from "drizzle-orm";

test("POST /groupSessions should create a group session", async (t) => {
    const app = await build(t);
    const sampleUser = await generateUser(app.db);
    const token = await encodeAuthToken(sampleUser.id, "user");
    const sampleTherapist = await generateTherapist(app.db, sampleUser.id);

    t.teardown(async () => {
        await app.db.delete(groupSession).where(eq(groupSession.therapistId, sampleTherapist.id));
        await app.db.delete(therapist).where(eq(therapist.id, sampleUser.id));
        await app.db.delete(user).where(eq(user.id, sampleUser.id))
    })

    const payload = {
        startTime: "2024-04-29 09:00:00",
        endTime: "2024-04-29 10:00:00",
        capacity: 15,
        therapistId: sampleTherapist.id,
        groupTopicId: 1,
        discordLink: "url goes here..."
    }

    const response = await app
    .inject()
    .headers({ authorization: `Bearer ${token}`})
    .post("/groupSessions")
    .payload(payload)

    const postedGroupSession = await app.db.query.groupSession.findFirst({
        where: and(
            eq(groupSession.groupTopicId, payload.groupTopicId),
            eq(groupSession.therapistId, payload.therapistId),
            eq(sql`DATE(${groupSession.startTime})`, payload.startTime)
        )
    })

    t.equal(response.statusCode, 201);
    t.ok(postedGroupSession);
})

test("POST /groupSessions should return 401 if not authenticated", async (t) => {
    const app = await build(t);
    const sampleUser = await generateUser(app.db);
    const sampleTherapist = await generateTherapist(app.db, sampleUser.id);
    
    t.teardown(async () => {
        await app.db.delete(groupSession).where(eq(groupSession.therapistId, sampleTherapist.id));
        await app.db.delete(therapist).where(eq(therapist.id, sampleUser.id));
        await app.db.delete(user).where(eq(user.id, sampleUser.id));
    })

    const payload = {
        startTime: "2024-04-29 09:00:00",
        endTime: "2024-04-29 10:00:00",
        capacity: 15,
        therapistId: sampleTherapist.id,
        groupTopicId: 1,
        discordLink: "url goes here..."
    }

    const response = await app
    .inject()
    .post("/groupSessions")
    .payload(payload)

    t.equal(response.statusCode, 401);
})