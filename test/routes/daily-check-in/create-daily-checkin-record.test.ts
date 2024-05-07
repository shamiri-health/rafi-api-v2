import { test } from "tap";
import { eq } from "drizzle-orm";
import { faker } from "@faker-js/faker";
import { build } from "../../helper";
import { generateUser } from "../../fixtures/users";
import { encodeAuthToken } from "../../../src/lib/utils/jwt";
import {
  dailyCheckIn,
  human,
  rewardHubRecord,
  user,
  userAchievement,
} from "../../../src/database/schema";
import {
  generateRewardHubRecord,
  generateUserAchievement,
} from "../../fixtures/rewardHub";
import CHECKINPROMPTS from "../../../static/daily_checkin_prompts.json";

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
    await app.db.delete(human).where(eq(human.id, sampleUser.id));
  });
  
  const payload = {
    how_are_you_feeling: faker.helpers.arrayElement(CHECKINPROMPTS.DAILY_CHECK_FEELING),
    mood_description: faker.helpers.arrayElement(CHECKINPROMPTS.MOOD_DESCRIPTION),
    mood_description_cause_category_1: faker.helpers.arrayElement(Object.keys(CHECKINPROMPTS.MOOD_DESCRIPTION_CAUSE)),
    mood_description_cause_response_1: faker.helpers.arrayElement(CHECKINPROMPTS.MOOD_DESCRIPTION_CAUSE.Academics),
    mood_description_cause_category_2: faker.helpers.arrayElement(Object.keys(CHECKINPROMPTS.MOOD_DESCRIPTION_CAUSE)),
    mood_description_cause_response_2: faker.helpers.arrayElement(CHECKINPROMPTS.MOOD_DESCRIPTION_CAUSE.Family),
    mood_description_cause_category_3: faker.helpers.arrayElement(Object.keys(CHECKINPROMPTS.MOOD_DESCRIPTION_CAUSE)),
    mood_description_cause_response_3: faker.helpers.arrayElement(CHECKINPROMPTS.MOOD_DESCRIPTION_CAUSE.Health),
  };
  
  const response = await app
    .inject()
    .headers({ authorization: `bearer ${token}` })
    .post("/daily-check-in")
    .payload(payload);

  const body = await response.json();

  for (const key of Object.keys(payload)) {
    t.ok(body.hasOwnProperty(key));
    // @ts-ignore
    t.equal(body[key], payload[key]);
  }
  
  t.equal(response.statusCode, 201);
  
});
