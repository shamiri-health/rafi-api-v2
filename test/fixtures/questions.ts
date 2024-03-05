import { faker } from "@faker-js/faker";
import { database } from "../../src/lib/db";
import { answers, questions } from "../../src/database/schema";
import { randomUUID } from "node:crypto";

export const generateQuestionForUser = async (
  db: database["db"],
  userId: number,
) => {
  const [createdQuestion] = await db
    .insert(questions)
    .values({
      id: randomUUID(),
      question: faker.lorem.sentence(),
      userId,
    })
    .returning();

  return createdQuestion;
};

export const generateAnswerForQuestionAndTherapist = async (
  db: database["db"],
  questionId: string,
  therapist: string | null = null,
) => {
  const [answer] = await db
    .insert(answers)
    .values({
      answer: faker.lorem.sentence(),
      id: randomUUID(),
      questionId,
    })
    .returning();

  return answer;
};
