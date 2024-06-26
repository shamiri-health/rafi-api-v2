import { sql, eq, and, isNull } from "drizzle-orm";
import { randomUUID } from "crypto";

import type { database } from "./db";
import {
  cbtEvent,
  onsiteEvent,
  phoneEvent,
  therapySession,
  userService,
  groupEvent,
} from "../database/schema";

export const recommendTeleTherapySession = async (
  db: database["db"],
  userId: number,
  therapistId: number,
) => {
  const query = sql`
        SELECT * from ${therapySession}
        INNER JOIN ${phoneEvent}
        ON ${phoneEvent.id} = ${therapySession.id}
        WHERE ${therapySession.userId} = ${userId}
        AND ${therapySession.type} = 'phoneEvent'
        AND DATE(${therapySession.recommendDatetime}) > DATE(NOW())
        AND ${therapySession.completeDatetime} IS NULL
        AND ${phoneEvent.therapistId} = ${therapistId}
        
    `;
  const recommendedSessions = await db.execute(query);

  if (recommendedSessions.length) {
    return recommendedSessions;
  }
  // check if the user has an assigned therapist
  const selectedUser = await db.query.userService.findFirst({
    where: eq(userService.userId, userId),
  });

  if (!selectedUser?.assignedTherapistId) {
    await db
      .update(userService)
      .set({
        assignedTherapistId: therapistId,
      })
      .where(eq(userService.userId, userId));
  }

  return await db.transaction(async (trx) => {
    try {
      // Recommend a session to this user
      const [recommendedTherapySession] = await trx
        .insert(therapySession)
        .values({
          id: randomUUID(),
          userId,
          type: "phoneEvent",
          relatedDomains: "wellbeing",
          recommendDatetime: new Date(),
          clinicalLevel: 1,
        })
        .returning();

      await trx.insert(phoneEvent).values({
        id: recommendedTherapySession.id,
        therapistId,
        googleTherapistEventId: recommendedTherapySession.id,
      });

      return await db.execute(query);
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  });
};

export const recommendOnsiteSession = async (
  db: database["db"],
  userId: number,
  therapistId: number,
) => {
  const query = sql`
        SELECT * from ${therapySession}
        INNER JOIN ${onsiteEvent}
        ON ${onsiteEvent.id} = ${therapySession.id}
        WHERE ${therapySession.userId} = ${userId}
        AND ${therapySession.type} = 'onsiteEvent'
        AND DATE(${therapySession.recommendDatetime}) > DATE(NOW())
        AND ${therapySession.completeDatetime} IS NULL
        AND ${onsiteEvent.therapistId} = ${therapistId}
    `;
  const recommendedSessions = await db.execute(query);

  if (recommendedSessions.length) {
    return recommendedSessions;
  }

  // check if the user has an assigned therapist
  const selectedUser = await db.query.userService.findFirst({
    where: eq(userService.userId, userId),
  });

  if (!selectedUser?.assignedTherapistId) {
    await db
      .update(userService)
      .set({
        assignedTherapistId: therapistId,
      })
      .where(eq(userService.userId, userId))
      .returning();
  }

  return await db.transaction(async (trx) => {
    try {
      const [recommendedTherapySession] = await trx
        .insert(therapySession)
        .values({
          id: randomUUID(),
          userId,
          type: "onsiteEvent",
          relatedDomains: "wellbeing",
          recommendDatetime: new Date(),
          clinicalLevel: 1,
        })
        .returning();

      await trx.insert(onsiteEvent).values({
        id: recommendedTherapySession.id,
        therapistId,
      });

      return await db.execute(query);
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  });
};

export const recommendGroupSession = async (
  db: database["db"],
  userId: number,
  topicId: number,
) => {
  const query = sql`
    SELECT * from ${therapySession}
    INNER JOIN ${groupEvent}
    ON ${groupEvent.id} = ${therapySession.id}
    WHERE ${therapySession.userId} = ${userId}
    AND ${therapySession.type} = 'groupEvent'
    AND ${groupEvent.groupTopicId} = ${topicId}
    AND ${therapySession.completeDatetime} IS NULL
  `;

  const recommendedGroupSessions = await db.execute(query);

  if (recommendedGroupSessions.length) {
    return recommendedGroupSessions;
  }

  return await db.transaction(async (trx) => {
    try {
      const [recommendedTherapySession] = await trx
        .insert(therapySession)
        .values({
          id: randomUUID(),
          userId,
          type: "groupEvent",
          recommendDatetime: new Date(),
          relatedDomains: "wellbeing",
        })
        .returning();

      await trx.insert(groupEvent).values({
        id: recommendedTherapySession.id,
        groupTopicId: topicId,
      });

      return await db
        .select()
        .from(therapySession)
        .innerJoin(groupEvent, eq(groupEvent.id, therapySession.id))
        .where(
          and(
            eq(therapySession.userId, userId),
            eq(therapySession.type, "groupEvent"),
            isNull(therapySession.completeDatetime),
            eq(groupEvent.groupTopicId, topicId),
          ),
        );
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  });
};

export const recommendShamiriDigitalSession = async (
  db: database["db"],
  userId: number,
  courseId: number,
) => {
  const enrolledShamiriDigital = await db
    .select()
    .from(therapySession)
    .innerJoin(cbtEvent, eq(cbtEvent.id, therapySession.id))
    .where(
      and(
        eq(therapySession.userId, userId),
        eq(therapySession.type, "cbtEvent"),
        isNull(therapySession.completeDatetime),
        eq(cbtEvent.cbtCourseId, courseId),
      ),
    );

  if (enrolledShamiriDigital.length) {
    return enrolledShamiriDigital;
  }

  return await db.transaction(async (trx) => {
    try {
      const [postedTherapySession] = await trx
        .insert(therapySession)
        .values({
          id: randomUUID(),
          userId,
          type: "cbtEvent",
          recommendDatetime: new Date(),
          relatedDomains: "wellbeing",
          clinicalLevel: 1,
        })
        .returning();

      await trx.insert(cbtEvent).values({
        id: postedTherapySession.id,
        userModule: 0,
        cbtCourseId: courseId,
        userProgress: `${courseId}.1.1`,
      });

      return await db
        .select()
        .from(therapySession)
        .innerJoin(cbtEvent, eq(cbtEvent.id, therapySession.id))
        .where(
          and(
            eq(therapySession.userId, userId),
            eq(therapySession.type, "cbtEvent"),
            isNull(therapySession.completeDatetime),
            eq(cbtEvent.cbtCourseId, courseId),
          ),
        );
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  });
};
