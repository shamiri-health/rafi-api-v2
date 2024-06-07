import { eq } from "drizzle-orm";
import type { database } from "../../db";
import { userService } from "../../../database/schema";
import { sample } from "lodash";

export async function createOnsiteOrder(db: database["db"], userId: number, startTime: Date, endTime: Date) {
  const userServiceRecord = await db.query.userService.findFirst({
    where: eq(userService.userId, userId)
  })

  let therapistId = userServiceRecord?.assignedTherapistId;

  if (!therapistId) {
    therapistId = sample([10, 205])
  }

}

export async function createTeletherapyOrder(db: database["db"], userId: number, startTime: Date, endTime: Date) { }
