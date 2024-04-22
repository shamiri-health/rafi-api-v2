import { test } from "tap";
import { build } from "../../helper";
import { client, human, therapist, user } from "../../../src/database/schema";
import { faker } from "@faker-js/faker";
import { eq, inArray } from "drizzle-orm";

test("POST /support/upload-users-for-client", async (t) => {
  // given
  const app = await build(t);
  const [sampleClient] = await app.db
    .insert(client)
    .values({
      companyName: faker.company.name(),
      label: faker.company.buzzVerb(),
    })
    .returning();

  await app.db
    .insert(therapist)
    .values([
      {
        id: 205,
        gmail: faker.internet.email(),
        dateOfBirth: new Date(),
      },
      { id: 10, gmail: faker.internet.email(), dateOfBirth: new Date() },
    ])
    .onConflictDoNothing({ target: therapist.id });

  t.teardown(async () => {
    const [deletedUser] = await app.db
      .delete(user)
      .where(eq(user.clientId, sampleClient.clientId))
      .returning();
    await app.db.delete(client).where(eq(client.id, sampleClient.id));
    await app.db.delete(therapist).where(inArray(therapist.id, [10, 205]));
    await app.db
      .delete(human)
      .where(inArray(human.id, [deletedUser.id, 10, 205]));
  });

  const users = [
    {
      education_level: "College",
      profession: "Healthcare Practitioners",
      email: faker.internet.email().toLowerCase(),
      phone_number: faker.phone.number(),
    },
  ];

  // when
  console.log("sample client.id: ", sampleClient.id);
  const response = await app
    .inject()
    .post("/support/upload-users-for-client")
    .payload({
      users,
      client_id: sampleClient.id,
    });

  const body = await response.json();

  // then
  const uploadedUser = await app.db.query.human.findFirst({
    where: eq(human.id, body[0].id),
  });

  t.ok(uploadedUser);
});
