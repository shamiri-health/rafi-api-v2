import { FastifyPluginAsync } from "fastify";
import { Type, Static, Date } from "@sinclair/typebox";
import { eq, or } from "drizzle-orm";
import {
  userAchievement,
  human,
  user,
  userRewardHub,
  rewardHubRecord,
  userGoal,
  userService,
  subscription,
  referralCodes,
} from "../../../database/schema";
import subscriptionTypes from "../../../../static/subscription_types.json";
import { sendVerificationCode } from "../../../lib/auth";
import client from "../../../lib/stream";
import { addDays } from "date-fns";

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
    async (request, _) => {
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

      const SYMON_ID = 10;
      const HELLEN_ID = 205;

      const userResult = await fastify.db.transaction(async (tx) => {
        // @ts-ignore
        const now: Date = new Date();
        try {
          const insertedHumanResult = await fastify.db
            .insert(human)
            .values({
              mobile: phoneNumber,
              email,
              role: "user",
            })
            .returning();

          let insertedUserResult = await fastify.db
            .insert(user)
            .values({
              id: insertedHumanResult[0].id,
              dateOfBirth: request.body.birth_date,
              educationalLevel: request.body.education_level,
              pinH: Buffer.from(
                "$2b$12$geh5R2I.08scNPuug5JnRuf/XXS1JsUKKwXAmz9FWb2BrnA/4Pj5G",
              ),
              profession: request.body.profession,
              registeredOn: now.toISOString(),
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

          // DEPRECATED: create reward hub record
          await fastify.db
            .insert(rewardHubRecord)
            .values({
              userRewardHubId: userRewardHubRecordResult[0].id,
              level: 1,
              gemsHave: 5,
              timestamp: now.toISOString(),
              streak: 0,
            })
            .returning();

          // DEPRECATED: create UserGoal record not to be confused with the Goals table
          await fastify.db.insert(userGoal).values({
            userRewardHubId: userRewardHubRecordResult[0].id,
            timestamp: now.toISOString(),
          });

          // create user achievement record
          await fastify.db.insert(userAchievement).values({
            userRewardHubId: userRewardHubRecordResult[0].id,
            userId: insertedHumanResult[0].id,
          });

          let userServiceRecord: typeof userService.$inferInsert = {
            userId: insertedHumanResult[0].id,
          };

          if (request.body.referral_code) {
            const referralRecord =
              await fastify.db.query.referralCodes.findFirst({
                where: eq(
                  referralCodes.referralCode,
                  request.body.referral_code.trim().toUpperCase(),
                ),
              });

            if (referralRecord) {
              insertedUserResult = await fastify.db
                .update(user)
                .set({
                  clientId: referralRecord.clientId,
                  referralRecordId: referralRecord.id,
                })
                .where(eq(user.id, insertedHumanResult[0].id))
                .returning();

              userServiceRecord.assignedTherapistId =
                Math.random() > 0.5 ? HELLEN_ID : SYMON_ID;
              // TODO: later on we need to toggle if we are using client's own therapists or our own
            }
          } else if (isMkuUser || TESTING_WHITELIST) {
            await fastify.db.update(user).set({
              clientId: MKU_CLIENT_ID,
            });

            userServiceRecord.assignedTherapistId =
              Math.random() > 0.5 ? HELLEN_ID : SYMON_ID;
          } else if (isMoringaUser) {
            insertedUserResult = await fastify.db
              .update(user)
              .set({
                clientId: MORINGA_CLIENT_ID,
              })
              .where(eq(user.id, insertedHumanResult[0].id))
              .returning();

            userServiceRecord.assignedTherapistId =
              Math.random() > 0.5 ? HELLEN_ID : SYMON_ID;
          }

          await fastify.db.insert(userService).values(userServiceRecord);

          if (!insertedUserResult[0].clientId) {
            const { validity, credit, subscriptionType } =
              subscriptionTypes.subscriptionOrder.individualIntroFreemium;

            const expireTime = addDays(now, validity);
            await fastify.db.insert(subscription).values({
              userId: insertedHumanResult[0].id,
              type: subscriptionType,
              timestamp: now,
              expireTime,
              ref: phoneNumber,
              totalCredit: credit,
              remCredit: credit,
            });
          }

          return {
            ...insertedUserResult[0],
            name: insertedHumanResult[0].name,
          };
        } catch (error) {
          await tx.rollback();
          fastify.log.error(error);
          throw error;
        }
      });

      if (userResult) {
        await sendVerificationCode(phoneNumber, "sms");
        try {
          // FIXME: might be better to use getOrCreate method here
          // if we get a user client then we have to scrub that record.
          await client.user(userResult.id.toString()).create({
            name: userResult?.name ?? `anonymous_${userResult.id}`,
            phoneNumber,
          });
        } catch (e) {
          fastify.log.warn(e);
          fastify.log.warn(
            `Could not create stream user for user id: ${userResult.id}`,
          );
        }
      } else {
        // TODO: best to log it to sentry
      }
    },
  );
};

export default createUserRoute;
