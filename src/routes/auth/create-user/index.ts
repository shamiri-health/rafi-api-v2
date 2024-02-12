import { FastifyPluginAsync } from "fastify";
import { Type, Static, Date } from "@sinclair/typebox";
import { eq, or } from "drizzle-orm";
import {
  userAchievement,
  human,
  user,
  userRewardHub,
  rewardHubRecord,
  goals,
  userGoal,
  referralCodes,
  userService,
} from "../../../database/schema";

const CreateUserBody = Type.Object({
  email: Type.String({ format: "email" }),
  phone_number: Type.String(),
  birth_date: Type.String({ format: "date" }),
  gender: Type.Union([
    Type.Literal("MALE"),
    Type.Literal("FEMALE"),
    Type.Literal("PREFER NOT TO SAY"),
  ]),
  education_level: Type.Union([
    Type.Literal("Primary School"),
    Type.Literal("High School"),
    Type.Literal("College"),
    Type.Literal("Graduate"),
  ]),
  referral_code: Type.Optional(Type.String()),
  profession: Type.Union([
    Type.Literal("Computer and Mathematical"),
    Type.Literal("Architecture and Engineering"),
    Type.Literal("Legal"),
    Type.Literal("Education, Training, and Library"),
    Type.Literal("Business and Financial Operations"),
    Type.Literal("Healthcare Practitioners"),
    Type.Literal("Food Preparation and Serving"),
    Type.Literal("Installation, Maintenance, and Repair"),
    Type.Literal("Arts, Design, Entertainment, Sports, and Media"),
    Type.Literal("Community and Social Service"),
    Type.Literal("Building and Grounds Cleaning and Maintenance"),
    Type.Literal("Construction and Extraction"),
    Type.Literal("Production"),
    Type.Literal("Personal Care and Service"),
    Type.Literal("Office and Administrative Support"),
    Type.Literal("Protective Service"),
    Type.Literal("Farming, Fishing, and Forestry"),
    Type.Literal("Life, Physical, and Social Science"),
    Type.Literal("Healthcare Support"),
    Type.Literal("Management"),
    Type.Literal("Sales and Related"),
    Type.Literal("Transportation and Materials Moving"),
  ]),
});

type CreateUserBody = Static<typeof CreateUserBody>;

const createUserRoute: FastifyPluginAsync = async (
  fastify,
  _,
): Promise<void> => {
  fastify.post<{ Body: CreateUserBody }>(
    "/",
    { schema: { body: CreateUserBody } },
    async (request, reply) => {
      const phoneNumber = request.body.phone_number.trim().toLowerCase();
      const email = request.body.email.trim().toLowerCase();

      const existingUser = await fastify.db.query.human.findFirst({
        where: or(eq(human.mobile, phoneNumber), eq(human.email, email)),
      });

      if (existingUser) {
        const error = existingUser.email === email ? "email" : "phone";
        throw fastify.httpErrors.badRequest(
          `A user exists with the supplied ${error}`,
        );
      }

      const TESTING_WHITELIST = [
        "bennyhinnotieno@gmail.com",
        "bkochuku@gmail.com ",
        "kimujnr@yahoo.com",
        "evan@shamirihealth.com",
        "faith.kamau@shamiri.institute",
        "wambuihellen690@gmail.com",
        "nyareso@shamiri.institute",
        "gkanyari@gmail.com",
        "jacklinewanjiru273@gmail.com",
        "jeankasuddi@gmail.com",
        "mukariakelvin17@gmail.com",
        "kendijuma@gmail.com",
        "k.coovi@gmail.com",
        "linetkarim@gmail.com",
        "lynnette.waruguru@shamiri.institute",
        "marieodhiambo@gmail.com",
        "natalie.mukami@shamirihealth.com",
        "paulosokoth@gmail.com",
        "mumanyarosine@gmail.com",
        "wanji.wangondu@gmail.com",
        "mmbonewendy@gmail.com",
        "winnanlucia@yahoo.com",
      ];

      const isMkuUser = email.endsWith("@mylife.mku.ac.ke");
      const isMoringaUser = email.endsWith("@moringaschool.com");

      // TODO: create a better programmatic way of checking this
      const MKU_CLIENT_ID = 20;
      const MORINGA_CLIENT_ID = 18;

      const userResult = await fastify.db.transaction(async (tx) => {
        try {
          const insertedHumanResult = await fastify.db
            .insert(human)
            .values({
              mobile: phoneNumber,
              email,
              role: "user",
            })
            .returning();

          const insertedUserResult = await fastify.db
            .insert(user)
            .values({
              id: insertedHumanResult[0].id,
              dateOfBirth: request.body.birth_date,
              educationLevel: request.body.education_level,
              profession: request.body.profession,
              registeredOn: new Date(),
            })
            .returning();

          const userRewardHubRecordResult = await fastify.db
            .insert(userRewardHub)
            .values({
              userId: insertedHumanResult[0].id,
              level: 1,
              gemsHave: 5,
            })
            .returning();

          const rewardHubRecordResult = await fastify.db
            .insert(rewardHubRecord)
            .values({
              userRewardHubId: userRewardHubRecordResult[0].id,
              level: 1,
              gemsHave: 5,
              timestamp: new Date().toISOString(),
              streak: 0,
            })
            .returning();

          const goalRecordResult = await fastify.db.insert(userGoal).values({
            userRewardHubId: userRewardHubRecordResult[0].id,
            timestamp: new Date().toISOString(),
          });

          const userAchievementRecordResult = await fastify.db
            .insert(userAchievement)
            .values({
              userRewardHubId: userRewardHubRecordResult[0].id,
              userId: insertedHumanResult[0].id,
            });

          let userServiceRecord: typeof userService.$inferInsert = {};

          if (request.body.referral_code) {
            const referralRecord =
              await fastify.db.query.referralCodes.findFirst({
                where: {
                  referralCode: request.body.referral_code.trim().toUpperCase(),
                },
              });

            if (referralRecord) {
              await fastify.db
                .update(user)
                .set({
                  clientId: referralRecord.clientId,
                  referralRecordId: referralRecord.id,
                })
                .where({
                  id: insertedHumanResult[0].id,
                });
              userServiceRecord.userId;
            }
          }
        } catch (error) {
          await tx.rollback();
          fastify.log.error(error);
          throw error;
        }
      });
      return { test: "me " };
    },
  );
};

export default createUserRoute;
