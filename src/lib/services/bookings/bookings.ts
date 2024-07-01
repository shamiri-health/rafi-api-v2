import { eq, inArray } from "drizzle-orm";
import type { database } from "../../db";
import {
  onsiteEvent,
  therapist,
  therapySession,
  userService,
} from "../../../database/schema";
import { sample, shuffle } from "lodash";
import { checkLegacyTherapistAvailability } from "../../therapist-availability";
import { httpErrors } from "@fastify/sensible";
import { randomUUID } from "crypto";

// const NO_REPLY_EMAIL = "c_gln4ru3g4sbsra98vruhvte5nk@group.calendar.google.com";

// export async function updateOnsiteEventDetails(
//   db: database["db"],
//   userId: number,
//   startTime,
//   endTime,
// ) { }

export async function updateOnsiteEvent(
  db: database["db"],
  userId: number,
  startTime: Date,
  endTime: Date,
) {
  return {};
}

export async function createOnsiteEvent(
  db: database["db"],
  userId: number,
  userAlias: string,
  startTime: Date,
  endTime: Date,
  dataPrivacyList: string[],
) {
  const userServiceRecord = await db.query.userService.findFirst({
    where: eq(userService.userId, userId),
  });

  let therapistId = 3216 || userServiceRecord?.assignedTherapistId;

  if (therapistId) {
    const existingTherapist = await db.query.therapist.findFirst({
      where: eq(therapist.id, therapistId),
    });

    const emails = [existingTherapist?.gmail.toLowerCase() as string];

    const availability = await checkLegacyTherapistAvailability(
      emails,
      startTime,
      endTime,
    );

    console.log(availability);

    if (!availability) {
      throw httpErrors.badRequest(
        "Could not create event as the assigned therapist was not available during the specified times",
    if (availability[0]?.errors) {
      throw httpErrors.internalServerError(
        "Could not create event as there was an issue finding available slots",
      );
    }

    if (availability[0]?.available) {
      throw httpErrors.internalServerError("Could not create event as the assigned therapist was not available at the specified time")
    }

    return await db.transaction(async (trx) => {
      const [session] = await trx
        .insert(therapySession)
        .values({
          id: randomUUID(),
          userId,
          type: "onsiteEvent",
          enrollDatetime: new Date(),
          recommendDatetime: new Date(),
          clinicalLevel: 2,
        })
        .returning();

      const [newEvent] = await trx.insert(onsiteEvent).values({
        id: session.id,
        therapistId,
        // TODO: update this to be existing therapist.name
        summary: `Onsite session with user: ${userAlias} and ${existingTherapist?.id}`,
        startTime,
        endTime,
        dataPrivacyString: dataPrivacyList.join(","),
      });

      // TODO:
      // create calendar invite

      return newEvent;
    });
  }

  // const therapists = await db
  //   .select()
  //   .from(therapist)
  //   .innerJoin(therapistCal, eq(therapistCal.id, therapist.id))
  //   .innerJoin(calendar, eq(calendar.id, therapistCal.id))
  //   .where(inArray(therapist.id, [10, 205]));
  //
  // let event;
  // for (let therapist of therapists) {
  //   const availability = await checkTherapistAvailability(
  //     [therapist.therapist.gmail, therapist.calendar.googleId as string],
  //     startTime,
  //     endTime,
  //     "https://api.calendly.com/users/0fade096-1c36-425e-a94d-d6250302e925",
  //   );
  //
  //   if (availability) {
  //     event = await db.transaction(async (trx) => {
  //       const [session] = await trx
  //         .insert(therapySession)
  //         .values({
  //           id: randomUUID(),
  //           userId,
  //           type: "onsiteEvent",
  //           enrollDatetime: new Date(),
  //           recommendDatetime: new Date(),
  //           clinicalLevel: 2,
  //         })
  //         .returning();
  //
  //       const [newEvent] = await trx.insert(onsiteEvent).values({
  //         id: session.id,
  //         therapistId,
  //         // TODO: update this to be existing therapist.name
  //         summary: `Onsite session with user: ${userAlias} and ${therapist.therapist.id}`,
  //         startTime,
  //         endTime,
  //         dataPrivacyString: dataPrivacyList.join(","),
  //       });
  //       // TODO: create calendar invite
  //
  //       return newEvent;
  //     });
  //     break;
  //   }
  // }
  //
  // if (!event) {
  //   throw httpErrors.badRequest(
  //     "Could not create an onsite event because there was no therapist available",
  //   );
  // }
  //
  // return event;
}

export async function createTeletherapyEvent(
  db: database["db"],
  userId: number,
  startTime: Date,
  endTime: Date,
) {
  const userServiceRecord = await db.query.userService.findFirst({
    where: eq(userService.userId, userId),
  });

  console.log(startTime, endTime);

  let therapistId = userServiceRecord?.assignedTherapistId;

  if (!therapistId) {
    therapistId = sample([10, 205]);
  }
}
