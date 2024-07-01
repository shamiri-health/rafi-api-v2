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

    if (availability[0]?.errors) {
      throw httpErrors.internalServerError(
        "Could not create event as there was an issue finding available slots",
      );
    }

    if (availability[0]?.available) {
      throw httpErrors.internalServerError(
        "Could not create event as the assigned therapist was not available at the specified time",
      );
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

  const therapists = await db
    .select()
    .from(therapist)
    .where(inArray(therapist.id, [10, 205]));

  let event;
  let bookingIssues = [];
  // randomise the list of therapists
  for (let therapist of shuffle(therapists)) {
    const availability = await checkLegacyTherapistAvailability(
      [therapist.gmail],
      startTime,
      endTime,
    );

    if (availability[0].available) {
      event = await db.transaction(async (trx) => {
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
          summary: `Onsite session with user: ${userAlias} and ${therapist}`,
          startTime,
          endTime,
          dataPrivacyString: dataPrivacyList.join(","),
        });
        // TODO: create calendar invite

        return newEvent;
      });
      break;
    } else {
      bookingIssues.push({
        email: therapist.gmail,
        error: availability[0].errors,
      });
    }
  }

  if (!event) {
    console.log(JSON.stringify(bookingIssues, null, 2));
    throw httpErrors.badRequest(
      "Could not create an onsite event because there was no therapist available",
    );
  }

  return event;
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
