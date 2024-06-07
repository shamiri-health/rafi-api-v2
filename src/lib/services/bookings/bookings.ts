import { eq, inArray } from "drizzle-orm";
import type { database } from "../../db";
import {
  calendar,
  therapist,
  therapistCal,
  userService,
} from "../../../database/schema";
import { sample } from "lodash";
import checkTherapistAvailability from "../../therapist-availability";

const NO_REPLY_EMAIL = "c_gln4ru3g4sbsra98vruhvte5nk@group.calendar.google.com";

export async function createOnsiteEvent(
  db: database["db"],
  userId: number,
  startTime: Date,
  endTime: Date,
) {
  const userServiceRecord = await db.query.userService.findFirst({
    where: eq(userService.userId, userId),
  });

  let therapistId = userServiceRecord?.assignedTherapistId;

  if (therapistId) {
    const existingTherapist = await db.query.therapist.findFirst({
      where: eq(therapist.id, therapistId),
    });
    const otherCalendars = await db
      .select()
      .from(therapistCal)
      .innerJoin(calendar, eq(calendar.id, therapistCal.id))
      .where(eq(therapistCal.therapistId, therapistId));

    const emails = [
      existingTherapist?.gmail.toLowerCase() as string,
      otherCalendars[0].calendar.googleId as string,
      NO_REPLY_EMAIL,
    ];

    const availability = await checkTherapistAvailability(
      emails,
      startTime,
      endTime,
    );

    if (!availability) {
      // throw error and indicate assigned therapist is not available
    }
    // create event and return it
  }
  const therapists = await db
    .select()
    .from(therapist)
    .innerJoin(therapistCal, eq(therapistCal.id, therapist.id))
    .innerJoin(calendar, eq(calendar.id, therapistCal.id))
    .where(inArray(therapist.id, [10, 205]));

  let event;
  for (let therapist of therapists) {
    const availability = await checkTherapistAvailability(
      [therapist.therapist.gmail, therapist.calendar.googleId as string],
      startTime,
      endTime,
    );

    if (availability) {
      // create event
      // set event variable
      // break the loop
    }
  }

  if (!event) {
    // throw error that event could not be created because no therapist was available
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

  let therapistId = userServiceRecord?.assignedTherapistId;

  if (!therapistId) {
    therapistId = sample([10, 205]);
  }
}
