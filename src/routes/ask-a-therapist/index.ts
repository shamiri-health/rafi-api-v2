import { eq } from "drizzle-orm";
import { FastifyPluginAsync } from "fastify";
import { answers, questions } from "../../database/schema";
import { Static, Type } from "@sinclair/typebox";
import { randomUUID } from 'node:crypto'

const QuestionBody = Type.Object({
  question: Type.String(),
  therapistId: Type.Number(),
  therapist_id: Type.Optional(Type.Number()),
})

const AnswerBody = Type.Object({
  answer: Type.String(),
  therapist_id: Type.Optional(Type.Number()),
  questionId: Type.String(),
  question_id: Type.Optional(Type.String())
})

type QuestionBody = Static<typeof QuestionBody>
type AnswerBody = Static<typeof AnswerBody>

const askATherapistRouter: FastifyPluginAsync = async (fastify): Promise<void> => {
  // TODO: implement pagination
  // @ts-ignore
  fastify.get("/", { onRequest: fastify.authenticate }, async (request) => {
    //@ts-ignore
    return await fastify.db.query.questions.findMany({ where: eq(questions.id, request.user.sub) })
  })

  // @ts-ignore
  fastify.post<{ Body: QuestionBody }>("/question", { onRequest: fastify.authenticate, schema: { body: QuestionBody } }, async (request) => {
    const id = randomUUID() as string;
    const [newQuestion] = await fastify.db.insert(questions).values({
      // @ts-ignore
      id,
      // @ts-ignore
      userId: request.user.sub,
      therapistId: request.body.therapistId ?? request.body.therapist_id,
      question: request.body.question
    }).returning()

    return newQuestion;
  })

  // TODO: also add the therapist ID to track who answered the question
  // @ts-ignore
  fastify.post<{ Body: AnswerBody }>("/answer", { onRequest: fastify.authenticate, schema: { body: AnswerBody } }, async (request) => {
    const id = randomUUID() as string;
    const [postedAnswer] = await fastify.db.insert(answers).values({
      id,
      answer: request.body.answer,
      questionId: request.body.questionId ?? request.body.question_id,
    })

    return postedAnswer
  })

}

export default askATherapistRouter
