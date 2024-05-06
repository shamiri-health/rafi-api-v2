import { test } from "tap";
import { build } from "../../helper";
import { generateUser } from "../../fixtures/users";
import { encodeAuthToken } from "../../../src/lib/utils/jwt";
import { updateLastCheckin } from "../../fixtures/dailyCheckin";
import {
  dailyCheckIn,
  rewardHubRecord,
  user,
  userAchievement,
} from "../../../src/database/schema";
import { eq } from "drizzle-orm";
import { faker } from "@faker-js/faker";

test("POST /daily-check-in does update the streak and gems", async (t) => {
  const app = await build(t);
  const sampleUser = await generateUser(app.db);
  const token = await encodeAuthToken(sampleUser.id, "user");
  const gems = 5;
  const lastAchievementRecord = await updateLastCheckin(
    app.db,
    sampleUser.id,
    gems,
  );

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

  const body = await response.json();

  t.equal(response.statusCode, 201);
  t.notSame(lastAchievementRecord.streak, body.streak);
  t.notSame(lastAchievementRecord.gems, body.gems);
});
