import { Static, Type } from "@sinclair/typebox";
import { database } from "../lib/db";
import { eq } from "drizzle-orm";
import {
  client,
  human,
  referralCodes,
  rewardHubRecord,
  subscription,
  user,
  userAchievement,
  userGoal,
  userRewardHub,
  userService,
} from "../database/schema";
import { addDays } from "date-fns/addDays";
import subscriptionTypes from "../../static/subscription_types.json";
import { httpErrors } from "@fastify/sensible";

export const CreateUserBody = Type.Object({
  email: Type.String(), // FIXME: tighten this to use 'email format'
  phone_number: Type.String(),
  birth_date: Type.Optional(Type.String()), // FIXME: tighten this to use the 'date format'
  gender: Type.Optional(
    Type.Union([
      Type.Literal("MALE"),
      Type.Literal("FEMALE"),
      Type.Literal("PREFER NOT TO SAY"),
    ]),
  ),
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

type CreateUser = Static<typeof CreateUserBody>;

// TODO: ADD GLOBAL LOGGER
export async function createUser(
  db: database["db"],
  userData: CreateUser,
  clientId?: number,
) {
  const { phone_number: phoneNumber, email } = userData;
  const isMkuUser = email.endsWith("@mylife.mku.ac.ke");
  const isMoringaUser = email.endsWith("@moringaschool.com");
  const isZerakiUser = email.endsWith("@zeraki.app");
  const isAHNUser = email.endsWith("@africahealthcarenetwork.com");
  const isBelvaUser = email.endsWith("@belvadigital.com");

  // TODO: create a better programmatic way of checking this
  const MKU_CLIENT_ID = 20;
  const MORINGA_CLIENT_ID = 18;
  const ZERAKI_CLIENT_ID = 2;
  const AHN_CLIENT_ID = 24;
  const BELVA_CLIENT_ID = 23;

  const SYMON_ID = 10;
  const HELLEN_ID = 205;

  const userResult = await db.transaction(async (trx) => {
    const now = new Date();
    try {
      const insertedHumanResult = await trx
        .insert(human)
        .values({
          mobile: phoneNumber.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          role: "user",
        })
        .returning();

      let dateOfBirth: null | Date = null;

      if (userData.birth_date) {
        const [year, month, date] = userData.birth_date.split("/");
        dateOfBirth = new Date(`${year}-${month}-${date}`);
      }

      let insertedUserResult = await trx
        .insert(user)
        .values({
          id: insertedHumanResult[0].id,
          dateOfBirth,
          educationalLevel: userData.education_level,
          pinH: Buffer.from(
            "$2b$12$geh5R2I.08scNPuug5JnRuf/XXS1JsUKKwXAmz9FWb2BrnA/4Pj5G",
          ),
          clientId: null,
          avatarId: 1,
          gender2: userData.gender,
          profession: userData.profession,
          registeredOn: now,
        })
        .returning();

      const userRewardHubRecordResult = await trx
        .insert(userRewardHub)
        .values({
          userId: insertedHumanResult[0].id,
          level: 1,
          gemsHave: 5,
        })
        .returning();

      // DEPRECATED: create reward hub record
      await trx
        .insert(rewardHubRecord)
        .values({
          userRewardHubId: userRewardHubRecordResult[0].id,
          level: 1,
          gemsHave: 5,
          timestamp: now,
          streak: 0,
        })
        .returning();

      // DEPRECATED: create UserGoal record not to be confused with the Goals table
      await trx.insert(userGoal).values({
        userRewardHubId: userRewardHubRecordResult[0].id,
        timestamp: now,
      });

      // create user achievement record
      await trx.insert(userAchievement).values({
        userRewardHubId: userRewardHubRecordResult[0].id,
        userId: insertedHumanResult[0].id,
      });

      let userServiceRecord: typeof userService.$inferInsert = {
        userId: insertedHumanResult[0].id,
      };

      if (userData.referral_code) {
        console.log(`Referral code provided: ${userData.referral_code}`);
        const referralRecord = await trx.query.referralCodes.findFirst({
          where: eq(
            referralCodes.referralCode,
            userData.referral_code.trim().toUpperCase(),
          ),
        });

        if (referralRecord) {
          insertedUserResult = await trx
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
        } else {
          console.warn(
            `No referral record found for: ${userData.referral_code}`,
          );
        }
      } else if (isMkuUser) {
        console.log("MKU user identified");
        insertedUserResult = await trx
          .update(user)
          .set({
            clientId: MKU_CLIENT_ID,
          })
          .where(eq(user.id, insertedHumanResult[0].id))
          .returning();

        userServiceRecord.assignedTherapistId =
          Math.random() > 0.5 ? HELLEN_ID : SYMON_ID;
      } else if (isMoringaUser) {
        console.log("MORINGA USER INDENTIFIED");
        if (userData.referral_code) {
          console.log("REFERRAL RECORD ALSO DETECTED");
        }
        insertedUserResult = await trx
          .update(user)
          .set({
            clientId: MORINGA_CLIENT_ID,
          })
          .where(eq(user.id, insertedHumanResult[0].id))
          .returning();

        userServiceRecord.assignedTherapistId =
          Math.random() > 0.5 ? HELLEN_ID : SYMON_ID;
      } else if (isZerakiUser) {
        console.log("ZERAKI USER IDENTIFIED");
        insertedUserResult = await trx
          .update(user)
          .set({
            clientId: ZERAKI_CLIENT_ID,
          })
          .where(eq(user.id, insertedHumanResult[0].id))
          .returning();

        userServiceRecord.assignedTherapistId =
          Math.random() > 0.5 ? HELLEN_ID : SYMON_ID;
      } else if (isBelvaUser) {
        console.log("BELVA USER IDENTIFIED");
        insertedUserResult = await trx
          .update(user)
          .set({
            clientId: BELVA_CLIENT_ID,
          })
          .where(eq(user.id, insertedHumanResult[0].id))
          .returning();

        userServiceRecord.assignedTherapistId =
          Math.random() > 0.5 ? HELLEN_ID : SYMON_ID;
      } else if (isAHNUser) {
        console.log("AHN USER IDENTIFIED");
        insertedUserResult = await trx
          .update(user)
          .set({
            clientId: AHN_CLIENT_ID,
          })
          .where(eq(user.id, insertedHumanResult[0].id))
          .returning();

        userServiceRecord.assignedTherapistId =
          Math.random() > 0.5 ? HELLEN_ID : SYMON_ID;
      } else if (clientId) {
        console.log("Creating User with Client ID: ", clientId);

        const clientExists = await db.query.client.findFirst({
          where: eq(client.id, clientId),
        });

        if (!clientExists) {
          throw httpErrors.notFound(
            `Attempted to create user for client: ${clientId} but the client was not found`,
          );
        }

        insertedUserResult = await trx
          .update(user)
          .set({
            clientId,
          })
          .where(eq(user.id, insertedHumanResult[0].id))
          .returning();

        userServiceRecord.assignedTherapistId =
          Math.random() > 0.5 ? HELLEN_ID : SYMON_ID;
      }

      await trx.insert(userService).values(userServiceRecord);

      if (!insertedUserResult[0].clientId) {
        const { validity, credit, subscriptionType } =
          subscriptionTypes.subscriptionOrder.individualIntroFreemium;

        const expireTime = addDays(now, validity);
        await trx.insert(subscription).values({
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
      console.error(error);
      await trx.rollback();
      throw error;
    }
  });

  return userResult;
}
