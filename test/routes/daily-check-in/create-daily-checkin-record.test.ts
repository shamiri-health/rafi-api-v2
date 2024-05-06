import { test } from "tap";
import { and, eq, sql } from "drizzle-orm";
import { faker } from "@faker-js/faker";
import { build } from "../../helper";
import { generateUser } from "../../fixtures/users";
import { encodeAuthToken } from "../../../src/lib/utils/jwt";
import {
  dailyCheckIn,
  rewardHubRecord,
  user,
  userAchievement,
} from "../../../src/database/schema";
import {
  generateRewardHubRecord,
  generateUserAchievement,
} from "../../fixtures/rewardHub";

test("POST /daily-check-in should create a new daily checkin record", async (t) => {
  const app = await build(t);
  const sampleUser = await generateUser(app.db);
  const token = await encodeAuthToken(sampleUser.id, "user");

  // generate sample achievement
  await generateUserAchievement(app.db, sampleUser.id);
  // Generate a sample reward hub record
  await generateRewardHubRecord(app.db, sampleUser.id);

  t.teardown(async () => {
    await app.db
      .delete(rewardHubRecord)
      .where(eq(rewardHubRecord.userId, sampleUser.id));
    await app.db
      .delete(userAchievement)
      .where(eq(userAchievement.userId, sampleUser.id));
    await app.db
      .delete(dailyCheckIn)
      .where(eq(dailyCheckIn.userId, sampleUser.id));
    await app.db.delete(user).where(eq(user.id, sampleUser.id));
  });

  const payload = {
    how_are_you_feeling: faker.lorem.word(),
    mood_description: faker.lorem.sentence(),
    mood_description_cause_category_1: faker.lorem.word(),
    mood_description_cause_response_1: faker.lorem.word(),
    mood_description_cause_category_2: faker.lorem.word(),
    mood_description_cause_response_2: faker.lorem.word(),
    mood_description_cause_category_3: faker.lorem.word(),
    mood_description_cause_response_3: faker.lorem.word(),
  };

  const response = await app
    .inject()
    .headers({ authorization: `bearer ${token}` })
    .post("/daily-check-in")
    .payload(payload);
  
  // const body = await response.json();
  const checkInRecord = await app.db.query.dailyCheckIn.findFirst({
    where: and(
      eq(dailyCheckIn.userId, sampleUser.id),
      eq(sql`DATE(${dailyCheckIn.createdAt})`, sql`DATE(NOW())`),
    ),
  });
  
  t.equal(response.statusCode, 201);
  t.ok(checkInRecord);
  t.equal(checkInRecord.howAreYouFeeling, payload.how_are_you_feeling);
});
