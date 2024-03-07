import { FastifyPluginAsync } from "fastify";
import seedrandom from "seedrandom";
import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { Static, Type } from "@sinclair/typebox";
import { journal } from "../../schema";
import JOURNAL_QUESTION_BANK from "../../../static/journaling.json";

interface Journal {
  [category: string]: {
    [subCategory: string]: string[];
  };
}

const JournalEntry = Type.Object({
  id: Type.String(),
  createdAt: Type.Optional(Type.String({ format: "date-time" })),
  updatedAt: Type.Optional(Type.String({ format: "date-time" })),
  deletedAt: Type.Optional(Type.String({ format: "date-time" })),
  question1: Type.String(),
  tag: Type.Optional(Type.String()),
  content1: Type.String(),
  question2: Type.Optional(Type.String()),
  content2: Type.Optional(Type.String()),
  question3: Type.Optional(Type.String()),
  content3: Type.Optional(Type.String()),
});

const JournalCategories = Type.Array(Type.String());

const CreateJournalEntry = Type.Object({
  question_1: Type.String(),
  content_1: Type.String(),
  tag: Type.Optional(Type.Array(Type.String())),
  question_2: Type.Optional(Type.String()),
  content_2: Type.Optional(Type.String()),
  question_3: Type.Optional(Type.String()),
  content_3: Type.Optional(Type.String()),
});

const JournalEntryParams = Type.Object({
  journal_id: Type.String(),
});

const RecommendedJournal = Type.Object({
  category: Type.String(),
  sub_category: Type.String(),
  prompts: Type.Array(Type.String()),
});

type RecommendedJournal = Static<typeof RecommendedJournal>;
type JournalEntryParams = Static<typeof JournalEntryParams>;
type CreateJournalEntry = Static<typeof CreateJournalEntry>;
type JournalCategories = Static<typeof JournalCategories>;
type JournalEntry = Static<typeof JournalEntry>;

const journalCategories = Object.keys(JOURNAL_QUESTION_BANK);
const QUESTION_BANK: Journal = JOURNAL_QUESTION_BANK;

const journalRouter: FastifyPluginAsync = async (fastify, _): Promise<void> => {
  // @ts-ignore
  fastify.addHook("onRequest", fastify.authenticate);

  fastify.get(
    "/categories",
    {
      schema: {
        response: {
          200: JournalCategories,
        },
      },
    },
    async () => journalCategories,
  );

  fastify.get("/all", async () => {
    const categories = Object.keys(QUESTION_BANK);
    const output: Journal = {};
    for (const category of categories) {
      const sub_category_obj: { [key: string]: string[] } = {};
      const sub_categories = Object.keys(QUESTION_BANK[category]);

      for (const sub_category of sub_categories) {
        const prompts = QUESTION_BANK[category][sub_category];
        sub_category_obj[sub_category] = prompts;
      }
      output[category] = sub_category_obj;
    }
    return output;
  });

  fastify.get(
    "/recommended-for-you",
    {
      schema: {
        response: {
          200: Type.Array(RecommendedJournal),
        },
      },
    },
    async (request) => {
      const today = new Date();
      const seed = `${
        // @ts-ignore
        request.user.sub
      } ${today.getDay()} ${today.getMonth()} ${today.getFullYear()}`;
      const top_three_categories = shuffleJournals(journalCategories, seed);
      const recommendedJournals = [];

      for (const category of top_three_categories) {
        const subCategory = shuffleJournals(
          Object.keys(QUESTION_BANK[category]),
          seed,
        );
        for (const subCat of subCategory) {
          const prompts = shuffleJournals(
            QUESTION_BANK[category][subCat],
            seed,
          );
          const journal = {
            category: category,
            sub_category: subCategory,
            prompts: prompts,
          };
          recommendedJournals.push(journal);
        }
      }

      return recommendedJournals;
    },
  );

  fastify.get(
    "/",
    {
      schema: {
        response: {
          200: Type.Array(JournalEntry),
        },
      },
    },
    async (request) => {
      const journalEntries = await fastify.db.query.journal.findMany({
        // @ts-ignore
        where: eq(journal.userId, request.user.sub),
        orderBy: desc(journal.createdAt),
      });
      return journalEntries;
    },
  );

  fastify.post<{ Body: CreateJournalEntry }>(
    "/",
    {
      schema: {
        body: CreateJournalEntry,
        response: {
          201: JournalEntry,
        },
      },
    },
    async (request, reply) => {
      try {
        const now = new Date();
        const [journalEntry] = await fastify.db
          .insert(journal)
          .values({
            // @ts-ignore
            id: randomUUID(),
            createdAt: now,
            // @ts-ignore
            userId: request.user.sub,
            updatedAt: now,
            question1: request.body.question_1,
            content1: request.body.content_1,
            question2: request.body.question_2,
            content2: request.body.content_2,
            question3: request.body.question_3,
            content3: request.body.content_3,
            tag: request.body.tag,
          })
          .returning();
        return reply.code(201).send(journalEntry);
      } catch (error) {
        fastify.log.error(error);
        throw error;
      }
    },
  );

  fastify.get<{ Params: JournalEntryParams }>(
    "/:journal_id",
    {
      schema: {
        params: JournalEntryParams,
        response: {
          200: JournalEntry,
        },
      },
    },
    async (request) => {
      const { journal_id } = request.params;
      const journalEntry = await fastify.db.query.journal.findFirst({
        where: and(
          eq(journal.id, journal_id),
          // @ts-ignore
          eq(journal.userId, request.user.sub),
        ),
      });

      if (!journalEntry) {
        throw fastify.httpErrors.notFound(
          `Journal with id ${journal_id} not found.`,
        );
      }

      return journalEntry;
    },
  );

  fastify.put<{ Params: JournalEntryParams; Body: CreateJournalEntry }>(
    "/:journal_id",
    {
      schema: {
        body: CreateJournalEntry,
        params: JournalEntryParams,
        response: {
          200: JournalEntry,
        },
      },
    },
    async (request) => {
      const { journal_id } = request.params;
      const [updatedJournalEntry] = await fastify.db
        .update(journal)
        .set({
          // @ts-ignore
          updatedAt: new Date(),
          question1: request.body.question_1,
          content1: request.body.content_1,
          question2: request.body.question_2,
          content2: request.body.content_2,
          question3: request.body.content_3,
          content3: request.body.content_3,
        })
        .where(
          and(
            eq(journal.id, journal_id),
            // @ts-ignore
            eq(journal.userId, request.user.sub),
          ),
        )
        .returning();

      if (!updatedJournalEntry) {
        throw fastify.httpErrors.notFound(
          `Journal with the id ${journal_id} not found.`,
        );
      }

      return updatedJournalEntry;
    },
  );

  fastify.delete<{ Params: JournalEntryParams }>(
    "/:journal_id",
    async (request) => {
      const { journal_id } = request.params;
      const journalEntry = await fastify.db
        .delete(journal)
        .where(
          and(
            eq(journal.id, journal_id),
            // @ts-ignore
            eq(journal.userId, request.user.sub),
          ),
        )
        .returning();

      if (!journalEntry) {
        throw fastify.httpErrors.notFound(
          `Journal with the id ${journal_id} not found.`,
        );
      }

      return {};
    },
  );
};

export default journalRouter;

const shuffleJournals = (array: string[], seed: string) => {
  const rng = seedrandom(seed);
  const shuffledArray = array.slice();
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    let j = Math.floor(rng() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray.slice(0, 3);
};
