import { and, eq } from "drizzle-orm";
import { FastifyPluginAsync } from "fastify";
import { answers, questions } from "../../database/schema";
import { Static, Type } from "@sinclair/typebox";
import { randomUUID } from "node:crypto";
import QuestionBank from "../../../static/ask_a_therapist_question_bank.json";
import sampleSize from "lodash/sampleSize";
import sample from "lodash/sample";

const QuestionBody = Type.Object({
  question: Type.String(),
});

const AnswerBody = Type.Object({
  answer: Type.String(),
  therapist_id: Type.Number(),
  question_id: Type.String(),
});

const QuestionFetchParams = Type.Object({
  question_id: Type.String(),
});

const CommunityQuestionResponse = Type.Array(
  Type.Object({
    question: Type.String(),
    answer: Type.String(),
    category: Type.String(),
  }),
);

const NewQuestionResponse = Type.Object({
  id: Type.String(),
  question: Type.String(),
  user_id: Type.Integer(),
  created_at: Type.String({ format: "date-time" }),
  updated_at: Type.String({ format: "date-time" }),
  // TODO: don't merge until you get the correct type for answers
  // answers: Type.Optional(Type.Array(Type.Number()))
});

const NewAnswerResponse = Type.Object({
  id: Type.String(),
  answer: Type.String(),
  question_id: Type.String(),
  therapist_id: Type.Optional(Type.String()),
  created_at: Type.String({ format: "date-time" }),
  updated_at: Type.String({ format: "date-time" }),
});

const QuestionUpdateBody = Type.Pick(QuestionBody, ["question"]);

type QuestionBody = Static<typeof QuestionBody>;
type AnswerBody = Static<typeof AnswerBody>;
type QuestionFetchParams = Static<typeof QuestionFetchParams>;
type QuestionUpdateBody = Static<typeof QuestionUpdateBody>;
type CommunityQuestionResponse = Static<typeof CommunityQuestionResponse>;
type NewQuestionResponse = Static<typeof NewQuestionResponse>;

const askATherapistRouter: FastifyPluginAsync = async (
  fastify,
): Promise<void> => {
  // TODO: implement pagination
  // @ts-ignore
  fastify.get("/", { onRequest: fastify.authenticate }, async (request) => {
    return await fastify.db.query.questions.findMany({
      // @ts-ignore
      where: eq(questions.userId, request.user.sub),
    });
  });

  fastify.post<{ Body: QuestionBody }>(
    "/question",
    {
      // @ts-ignore
      onRequest: fastify.authenticate,
      schema: {
        body: QuestionBody,
        response: {
          201: NewQuestionResponse,
        },
      },
    },
    async (request, reply) => {
      const id = randomUUID() as string;
      const [newQuestion] = await fastify.db
        .insert(questions)
        .values({
          // @ts-ignore
          id,
          // @ts-ignore
          userId: request.user.sub,
          question: request.body.question,
        })
        .returning();

      const output = {
        ...newQuestion,
        created_at: newQuestion.createdAt,
        updated_at: newQuestion.updatedAt,
        user_id: newQuestion.userId,
      };

      return reply.code(201).send(output);
    },
  );

  // TODO: also add the therapist ID to track who answered the question
  // FIXME: we should have a way of authenticating requests from bubble/noloco/our own thing
  fastify.post<{ Body: AnswerBody }>(
    "/answer",
    { schema: { body: AnswerBody, response: { 201: NewAnswerResponse } } },
    async (request, reply) => {
      const id = randomUUID() as string;
      const [postedAnswer] = await fastify.db
        .insert(answers)
        .values({
          id,
          answer: request.body.answer,
          questionId: request.body.question_id,
        })
        .returning();

      return reply.code(201).send({
        ...postedAnswer,
        created_at: postedAnswer.createdAt,
        updated_at: postedAnswer.updatedAt,
        question_id: postedAnswer.questionId,
      });
    },
  );

  // FIXME: should also return the answer
  fastify.get<{ Params: QuestionFetchParams }>(
    "/question/:question_id",
    {
      // @ts-ignore
      onRequest: fastify.authenticate,
      schema: { params: QuestionFetchParams },
    },
    async (request) => {
      const existingQuestion = await fastify.db.query.questions.findFirst({
        where: and(
          eq(questions.id, request.params.question_id),
          // @ts-ignore
          eq(questions.userId, request.user.sub),
        ),
      });

      if (!existingQuestion) {
        throw fastify.httpErrors.notFound(
          `Question with id: ${request.params.question_id} not found for this user`,
        );
      }

      return existingQuestion;
    },
  );

  fastify.put<{ Params: QuestionFetchParams; Body: QuestionUpdateBody }>(
    "/question/:question_id",
    {
      // @ts-ignore
      onRequest: fastify.authenticate,
      schema: {
        body: QuestionUpdateBody,
        params: QuestionFetchParams,
        response: {
          200: NewQuestionResponse,
        },
      },
    },
    async (request) => {
      const [updatedQuestion] = await fastify.db
        .update(questions)
        .set({
          updatedAt: new Date(),
          question: request.body.question,
        })
        .where(
          and(
            eq(questions.id, request.params.question_id),
            // @ts-ignore
            eq(questions.userId, request.user.sub),
          ),
        )
        .returning();

      if (!updatedQuestion) {
        throw fastify.httpErrors.notFound(
          `Question with id: ${request.params.question_id} not found for current user`,
        );
      }

      return {
        ...updatedQuestion,
        created_at: updatedQuestion.createdAt,
        updated_at: updatedQuestion.updatedAt,
        user_id: updatedQuestion.userId,
      };
    },
  );

  fastify.delete<{ Params: QuestionFetchParams }>(
    "/question/:question_id",
    {
      // @ts-ignore
      onRequest: fastify.authenticate,
      schema: { params: QuestionFetchParams },
    },
    async (request) => {
      const [deletedQuestion] = await fastify.db
        .delete(questions)
        .where(
          and(
            eq(questions.id, request.params.question_id),
            // @ts-ignore
            eq(questions.userId, request.user.sub),
          ),
        )
        .returning();

      if (!deletedQuestion) {
        throw fastify.httpErrors.notFound(`Question not found for the user`);
      }

      return {};
    },
  );

  fastify.get(
    "/community-questions",
    {
      schema: {
        response: {
          200: CommunityQuestionResponse,
        },
      },
    },
    async () => {
      const randomFiveQuestions = sampleSize(Object.entries(QuestionBank), 5);

      const out = randomFiveQuestions.map(([category, questionAnswerPairs]) => {
        const [question, answer] = sample(
          Object.entries(questionAnswerPairs),
        ) as [string, string];

        return {
          category,
          question,
          answer,
        };
      });

      return out;
    },
  );
};

export default askATherapistRouter;
