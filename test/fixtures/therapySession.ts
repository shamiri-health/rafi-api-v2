import { randomUUID } from "crypto";
import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { database } from "../../src/lib/db";
import {
  cbtCourse,
  cbtEvent,
  groupEvent,
  groupTopic,
  onsiteEvent,
  phoneEvent,
  therapist,
  therapySession,
} from "../../src/database/schema";
import { generateHuman, generateTherapist } from "./users";

export const generatePhoneEvent = async (
  db: database["db"],
  userId: number,
  therapistId: number,
) => {
  const sampleTherapist = await db.query.therapist.findFirst({
    where: eq(therapist.id, therapistId),
  });

  if (!sampleTherapist) {
    await generateHuman(db, therapistId);
    await generateTherapist(db, therapistId);
  }

  const [postedTherapySession] = await db
    .insert(therapySession)
    .values({
      id: randomUUID(),
      userId,
      recommendDatetime: new Date(),
      relatedDomains: "wellbeing",
      clinicalLevel: 2,
      type: "phoneEvent",
      completeDatetime: new Date()
    })
    .returning();

    const [postedPhoneEvent] = await db
    .insert(phoneEvent)
    .values({
      id: postedTherapySession.id,
      therapistId,
      googleTherapistEventId: postedTherapySession.id,
    })
    .returning();

  return postedPhoneEvent;
};

export const generateOnsiteEvent = async (
  db: database["db"],
  userId: number,
  therapistId: number,
) => {
  const sampleTherapist = await db.query.therapist.findFirst({
    where: eq(therapist.id, therapistId),
  });

  if (!sampleTherapist) {
    await generateHuman(db, therapistId);
    await generateTherapist(db, therapistId);
  }

  const [postedTherapySession] = await db
    .insert(therapySession)
    .values({
      id: randomUUID(),
      userId,
      recommendDatetime: new Date(),
      relatedDomains: "wellbeing",
      clinicalLevel: 2,
      type: "onsiteEvent",
      completeDatetime: new Date()
    })
    .returning();

  const [postedOnsiteEvent] = await db
    .insert(onsiteEvent)
    .values({
      id: postedTherapySession.id,
      therapistId,
    })
    .returning();

  return postedOnsiteEvent;
};

export const generateGroupTopic = async (
  db: database["db"],
  topicId: number,
) => {
  const [postedGroupTopic] = await db
    .insert(groupTopic)
    .values({
      id: topicId,
      name: faker.lorem.word(),
      about: faker.lorem.words(),
      summary: faker.lorem.sentence(),
      relatedDomains: faker.lorem.word(),
      backgroundColor: faker.lorem.word(),
      buttonColor: faker.lorem.word(),
      assetUrl: faker.lorem.sentence(),
    })
    .returning();

  return postedGroupTopic;
};

export const generateGroupEvent = async (
  db: database["db"],
  userId: number,
  topicId: number,
) => {
  const sampleGroupTopic = await db.query.groupTopic.findFirst({
    where: eq(groupTopic.id, topicId),
  });

  if (!sampleGroupTopic) {
    await generateGroupTopic(db, topicId);
  }

  const [postedTherapySession] = await db
    .insert(therapySession)
    .values({
      id: randomUUID(),
      userId,
      recommendDatetime: new Date(),
      relatedDomains: "wellbeing",
      clinicalLevel: 2,
      type: "groupEvent",
      completeDatetime: new Date()
    })
    .returning();

  const [postedGroupEvent] = await db
    .insert(groupEvent)
    .values({
      id: postedTherapySession.id,
      groupTopicId: topicId,
    })
    .returning();

  return postedGroupEvent;
};

export const generateShamiriDigitalCourse = async (
  db: database["db"],
  courseId: number,
) => {
  const [postedCourse] = await db
    .insert(cbtCourse)
    .values({
      id: courseId,
      name: faker.lorem.word(),
      summary: faker.lorem.words(),
      modulesString: faker.lorem.sentence(),
      relatedDomains: faker.lorem.slug(),
      about: faker.lorem.sentences(),
      assetUrl: faker.lorem.sentence(),
      backgroundColor: faker.lorem.word(),
      buttonColor: faker.lorem.word(),
    })
    .returning();

  return postedCourse;
};

export const generateShamiriDigitalEvent = async (
  db: database["db"],
  userId: number,
  courseId: number,
) => {
  const sampleCBTCourse = await db.query.cbtCourse.findFirst({
    where: eq(cbtCourse.id, courseId),
  });

  if (!sampleCBTCourse) {
    await generateShamiriDigitalCourse(db, courseId);
  }

  const [postedTherapySession] = await db
    .insert(therapySession)
    .values({
      id: randomUUID(),
      userId,
      recommendDatetime: new Date(),
      relatedDomains: "wellbeing",
      clinicalLevel: 2,
      type: "cbtEvent",
      completeDatetime: new Date()
    })
    .returning();

  const [postedCBTEvent] = await db
    .insert(cbtEvent)
    .values({
      id: postedTherapySession.id,
      userModule: 0,
      cbtCourseId: courseId,
      userProgress: `${courseId}.1.1`,
    })
    .returning();

  return postedCBTEvent;
};
