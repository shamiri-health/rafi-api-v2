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
  therapistId: Type.Number(),
  therapist_id: Type.Optional(Type.Number()),
});

const AnswerBody = Type.Object({
  answer: Type.String(),
  therapist_id: Type.Optional(Type.Number()),
  questionId: Type.String(),
  question_id: Type.Optional(Type.String()),
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

const QuestionUpdateBody = Type.Pick(QuestionBody, ["question"]);

type QuestionBody = Static<typeof QuestionBody>;
type AnswerBody = Static<typeof AnswerBody>;
type QuestionFetchParams = Static<typeof QuestionFetchParams>;
type QuestionUpdateBody = Static<typeof QuestionUpdateBody>;
type CommunityQuestionResponse = Static<typeof CommunityQuestionResponse>;

const askATherapistRouter: FastifyPluginAsync = async (
  fastify,
): Promise<void> => {
  // TODO: implement pagination
  // @ts-ignore
  fastify.get("/", { onRequest: fastify.authenticate }, async (request) => {
    return await fastify.db.query.questions.findMany({
      // @ts-ignore
      where: eq(questions.id, request.user.sub),
    });
  });

  fastify.post<{ Body: QuestionBody }>(
    "/question",
    // @ts-ignore
    { onRequest: fastify.authenticate, schema: { body: QuestionBody } },
    async (request) => {
      const id = randomUUID() as string;
      const [newQuestion] = await fastify.db
        .insert(questions)
        .values({
          // @ts-ignore
          id,
          // @ts-ignore
          userId: request.user.sub,
          therapistId: request.body.therapistId ?? request.body.therapist_id,
          question: request.body.question,
        })
        .returning();

      return newQuestion;
    },
  );

  // TODO: also add the therapist ID to track who answered the question
  fastify.post<{ Body: AnswerBody }>(
    "/answer",
    // @ts-ignore
    { onRequest: fastify.authenticate, schema: { body: AnswerBody } },
    async (request) => {
      const id = randomUUID() as string;
      const [postedAnswer] = await fastify.db.insert(answers).values({
        id,
        answer: request.body.answer,
        questionId: request.body.questionId ?? request.body.question_id,
      });

      return postedAnswer;
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
      schema: { body: QuestionUpdateBody, params: QuestionFetchParams },
    },
    async (request) => {
      const [updatedQuestion] = await fastify.db
        .update(questions)
        .set({
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

      return updatedQuestion;
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
      try {
        // @ts-ignore
        await fastify.db.delete(questions).where(
          and(
            eq(questions.id, request.params.question_id),
            // @ts-ignore
            eq(questions.userId, request.user.sub),
          ),
        );
        fastify.log.info("Successfully deleted question");
      } catch (e) {
        fastify.log.error("Could not deleter");
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
