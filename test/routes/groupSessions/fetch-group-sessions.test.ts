import { test } from "tap";
import { build } from "../../helper";
import { generateUser } from "../../fixtures/users";
import { encodeAuthToken } from "../../../src/lib/utils/jwt";

test("GET /groupSessions should return a list of group sessions if available", async (t) => {
    const app = await build(t);
    const sampleUser = await generateUser(app.db);
    const token = await encodeAuthToken(sampleUser.id, "user");

    const response = await app
    .inject()
    .headers({ authorization: `bearer ${token}`})
    .get("/groupSessions")
    
    t.equal(response.statusCode, 200);
    t.ok(response.payload)
})

test("GET /groupSessions should return 401 if the user is unauthorized", async (t) => {
    const app = await build(t);

    const response = await app
    .inject()
    .get("/groupSessions")
    
    t.equal(response.statusCode, 401);
})