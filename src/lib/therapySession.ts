import { sql, eq, and, isNull } from "drizzle-orm";
import { randomUUID } from "crypto";

import type { database } from "./db";
import { cbtEvent, onsiteEvent, phoneEvent, therapySession, userService } from "../database/schema";
import { groupEvent } from "../schema";

export const recommendTeleTherapySession = async (
    db: database['db'], 
    userId: number, 
    therapistId: number, 
) => {
    const query = sql `
        SELECT * from ${therapySession}
        WHERE ${therapySession.userId} = ${userId}
        AND ${therapySession.type} = 'phoneEvent'
        AND DATE(${therapySession.recommendDatetime}) > DATE(NOW())
        AND ${therapySession.completeDatetime} IS NULL
    `
    const recommendedSessions = await db.execute(query);
    
    // find a recommended therapy session associated with the therapist
    const therapistSession = recommendedSessions.find(session => session.therapistId === therapistId);

    // check if the user has an assigned therapist
    const selectedUser = await db.query.userService.findFirst({
        where: eq(userService.userId, userId)
    });

    if (!selectedUser?.assignedTherapistId) {
        try {
            await db
            .update(userService)
            .set({
                assignedTherapistId: therapistId
            })
            .where(
                eq(userService.userId, userId)
            )
            .returning();
        } catch (error) {
            throw error
        }
    }


    if(!therapistSession) {
        await db.transaction(async trx => {
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
                }).returning();

                const [recommendedPhoneEvent] = await trx
                .insert(phoneEvent)
                .values({
                    id: recommendedTherapySession.id,
                    therapistId,
                    googleTherapistEventId: randomUUID()
                }).returning();

                return recommendedPhoneEvent;
            } catch (error) {
                await trx.rollback();
                throw error;
            }
        })
    }

    return therapistSession;
}

export const recommendOnsiteSession = async (
    db: database['db'], 
    userId: number, 
    therapistId: number, 
) => {
    const query = sql `
        SELECT * from ${therapySession}
        WHERE ${therapySession.userId} = ${userId}
        AND ${therapySession.type} = 'onsiteEvent'
        AND DATE(${therapySession.recommendDatetime}) > DATE(NOW())
        AND ${therapySession.completeDatetime} IS NULL
    `
    const recommendedSessions = await db.execute(query);
    
    // find a recommended therapy session associated with the therapist
    const therapistSession = recommendedSessions.find(session => session.therapistId === therapistId);

    // check if the user has an assigned therapist
    const selectedUser = await db.query.userService.findFirst({
        where: eq(userService.userId, userId)
    });

    if (!selectedUser?.assignedTherapistId) {
        try {
            await db
            .update(userService)
            .set({
                assignedTherapistId: therapistId
            })
            .where(
                eq(userService.userId, userId)
            )
            .returning();
        } catch (error) {
            throw error
        }
    }

    if(!therapistSession) {
        await db.transaction(async trx => {
            try {
                // Recommend a session to this user
                const [recommendedTherapySession] = await trx
                .insert(therapySession)
                .values({
                    id: randomUUID(),
                    userId,
                    type: "onsiteEvent",
                    relatedDomains: "wellbeing",
                    recommendDatetime: new Date(),
                    clinicalLevel: 1
                }).returning();

                const [recommendedPhoneEvent] = await trx
                .insert(onsiteEvent)
                .values({
                    id: recommendedTherapySession.id,
                    therapistId,
                }).returning();

                return recommendedPhoneEvent;
            } catch (error) {
                await trx.rollback();
                throw error;
            }
        })
    }

    return therapistSession;
}

export const recommendGroupSession = async (
    db: database["db"],
    userId: number,
    topicId: number
) => {
    const enrolledGroupSesions = await db
    .select()
    .from(therapySession)
    .innerJoin(groupEvent, eq(groupEvent.id, therapySession.id))
    .where(and(
            eq(therapySession.userId, userId),
            eq(therapySession.type, "phoneEvent"),
            isNull(therapySession.completeDatetime)
        )
    )

    const recommendedGroupEvent = enrolledGroupSesions.find(session => session.groupEvent.groupTopicId === topicId);
    
    if (!recommendedGroupEvent) {
        await db.transaction(async trx => {
            try {
                const [recommendedTherapySession] = await trx
                .insert(therapySession)
                .values({
                    id: randomUUID(),
                    userId,
                    type: "groupEvent",
                    recommendDatetime: new Date(),
                    relatedDomains: "wellbeing"
                }).returning();

                const [recommendedGroupSession] = await trx
                .insert(groupEvent)
                .values({
                    id: recommendedTherapySession.id,
                    groupTopicId: topicId
                }).returning();

                return recommendedGroupSession;
            } catch (error) {
                await trx.rollback();
                throw error;
            }
        })
    }

    return recommendedGroupEvent;
}

export const recommendShamiriDigitalSession = async (
    db: database["db"], 
    userId: number, 
    courseId: number
) => {
    const query = sql `
        SELECT * from ${therapySession} 
        WHERE ${therapySession.userId} = ${userId} 
        AND ${therapySession.completeDatetime} IS NULL
        AND ${therapySession.type} = 'cbtEvent' 
    `
    const enrolledShamiriDigitalSessions = await db.execute(query);

    // Find if the recommended courseId is amoung the enrolled courses.
    const shamiriDigitalCourseId = enrolledShamiriDigitalSessions.find(event => event.cbtCourseId === courseId);
    
    if(!shamiriDigitalCourseId) {
        // create a new digital recommendation
        await db.transaction(async trx => {
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
                }).returning();
            
                const [postedShamiriDigitalSession] = await trx
                .insert(cbtEvent)
                .values({
                    id: postedTherapySession.id,
                    userModule: 0,
                    cbtCourseId: courseId,
                    userProgress: `${courseId}.1.1`
                }).returning();

                return postedShamiriDigitalSession;
            } catch (error) {
                await trx.rollback();
                throw error;
            }
        })
    }
    return enrolledShamiriDigitalSessions
}

