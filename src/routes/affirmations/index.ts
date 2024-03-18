import { FastifyPluginAsync } from "fastify";
import { and, eq, isNull } from "drizzle-orm";
import { shuffle } from "lodash";
import { randomUUID } from "crypto";
import { Static, Type } from "@sinclair/typebox";
import Affirmations from "../../../static/affirmations.json";
import { affirmation, affirmationOfTheDay } from "../../database/schema";
import { sql } from "drizzle-orm";
import { shuffleArray } from "../../lib/shuffleArray";

const CATEGORIES = Object.keys(Affirmations);
const AFFIRMATIONBANK: AffirmationObj = Affirmations;

interface AffirmationObj {
  [category: string]: {
    [subCategory: string]: string[];
  };
}

const AffirmationOfTheDay = Type.Object({
  id: Type.String(),
  created_at: Type.String({ format: "date-time" }),
  updated_at: Type.String({ format: "date-time" }),
  user_id: Type.Integer(),
  category: Type.String(),
  sub_category: Type.String(),
  affirmation: Type.String(),
});

const RecommendedAffirmation = Type.Object({
  category: Type.String(),
  sub_category: Type.String(),
  affirmation: Type.Array(Type.String()),
});

const Affirmation = Type.Object({
  id: Type.String(),
  content: Type.String(),
  category: Type.String(),
  createdAt: Type.String({ format: "date-time" }),
  updatedAt: Type.String({ format: "date-time" }),
  removedAt: Type.Optional(Type.String({ format: "date-time" })),
  background_file_name: Type.String(),
  userId: Type.Integer(),
});

const CreateAffirmation = Type.Pick(Affirmation, [
  "content",
  "category",
  "background_file_name",
]);

const AffirmationParams = Type.Object({
  affirmation_id: Type.String(),
});

type CreateAffirmation = Static<typeof CreateAffirmation>;
type AffirmationParams = Static<typeof AffirmationParams>;
type Affirmation = Static<typeof Affirmation>;
type RecommendedAffirmation = Static<typeof RecommendedAffirmation>;
type AffirmationOfTheDay = Static<typeof AffirmationOfTheDay>;

const affirmationsRouter: FastifyPluginAsync = async (
  fastify,
  _,
): Promise<void> => {
  // @ts-ignore
  fastify.addHook("onRequest", fastify.authenticate);

  fastify.get("/all", async () => {
    const output: AffirmationObj = {};
    for (let category of CATEGORIES) {
      const subCategoryObj: { [category: string]: string[] } = {};
      const subCategories = Object.keys(AFFIRMATIONBANK[category]);

      for (let subCategory of subCategories) {
        const prompts = AFFIRMATIONBANK[category][subCategory];
        subCategoryObj[subCategory] = prompts;
      }
      output[category] = subCategoryObj;
    }
    return output;
  });

  fastify.get(
    "/affirmation-of-the-day",
    {
      schema: {
        response: {
          200: AffirmationOfTheDay,
        },
      },
    },
    async (request, reply) => {
      // @ts-ignore
      const userId = request.user.sub;
      const query = sql`SELECT * FROM ${affirmationOfTheDay} WHERE ${affirmationOfTheDay.userId} = ${userId} AND DATE(${affirmationOfTheDay.createdAt}) = DATE(NOW())`;
      const [createdAffirmation] = await fastify.db.execute(query);

      if (createdAffirmation) {
        return {
          ...createdAffirmation,
          created_at: createdAffirmation.createdAt,
          updated_at: createdAffirmation.updatedAt,
        };
      }

      const category = shuffle(CATEGORIES);
      const subCategory = Object.keys(AFFIRMATIONBANK[category[0]]);
      const affirmation = shuffle(AFFIRMATIONBANK[category[0]][subCategory[0]]);

      try {
        const [newAffirmation] = await fastify.db
          .insert(affirmationOfTheDay)
          .values({
            id: randomUUID(),
            category: category[0],
            subCategory: subCategory[0],
            // @ts-ignore
            userId: request.user.sub,
            affirmation: affirmation[0],
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        return reply.code(201).send({
          ...newAffirmation,
          created_at: newAffirmation.createdAt,
          updated_at: newAffirmation.updatedAt,
        });
      } catch (error) {
        fastify.log.error(error);
        throw error;
      }
    },
  );

  fastify.get(
    "/recommended-for-you",
    {
      schema: {
        response: {
          200: Type.Array(RecommendedAffirmation),
        },
      },
    },
    async (request) => {
      const today = new Date();
      const seed = `${
        // @ts-ignore
        request.user.sub
      } ${today.getDay()} ${today.getMonth()} ${today.getFullYear()}`;

      const categories = shuffleArray(CATEGORIES, seed);
      const response = [];
      for (const category of categories) {
        const subCategories = shuffleArray(
          Object.keys(AFFIRMATIONBANK[category]),
          seed,
        );
        const affirmation = AFFIRMATIONBANK[category][subCategories[0]];

        response.push({
          category: category,
          sub_category: subCategories[0],
          affirmation: affirmation,
        });
      }
      return response;
    },
  );

  fastify.get(
    "/",
    {
      schema: {
        response: {
          200: Type.Array(Affirmation),
        },
      },
    },
    async (request) => {
      const postedAffirmations = await fastify.db.query.affirmation.findMany({
        where: and(
          // @ts-ignore
          eq(affirmation.userId, request.user.sub),
          isNull(affirmation.deletedAt),
        ),
      });

      return postedAffirmations.map(
        ({ backgroundFileName: background_file_name, ...rest }) => ({
          ...rest,
          background_file_name,
        }),
      );
    },
  );

  fastify.post<{ Body: CreateAffirmation }>(
    "/",
    {
      schema: {
        body: CreateAffirmation,
        response: {
          201: Affirmation,
        },
      },
    },
    async (request, reply) => {
      const { content, category, background_file_name } = request.body;
      const validCategory = CATEGORIES.includes(category);

      if (!validCategory) {
        throw fastify.httpErrors.notFound("The category choice is invalid");
      }

      try {
        const now = new Date();
        const [postedAffirmation] = await fastify.db
          .insert(affirmation)
          .values({
            // @ts-ignore
            id: randomUUID(),
            category,
            content,
            backgroundFileName: background_file_name,
            // @ts-ignore
            userId: request.user.sub,
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        const newAffirmation = {
          ...postedAffirmation,
          background_file_name: postedAffirmation.backgroundFileName,
        };

        return reply.code(201).send(newAffirmation);
      } catch (error) {
        fastify.log.error(error);
        throw error;
      }
    },
  );

  fastify.get<{ Params: AffirmationParams }>(
    "/:affirmation_id",
    {
      schema: {
        params: AffirmationParams,
        response: {
          200: Affirmation,
        },
      },
    },
    async (request) => {
      const { affirmation_id } = request.params;
      const postedAffirmation = await fastify.db.query.affirmation.findFirst({
        where: and(
          // @ts-ignore
          eq(affirmation.userId, request.user.sub),
          eq(affirmation.id, affirmation_id),
        ),
      });

      if (!postedAffirmation) {
        throw fastify.httpErrors.notFound(
          `Affirmation with the id of ${affirmation_id} not found.`,
        );
      }

      const requestedAffirmation = {
        ...postedAffirmation,
        background_file_name: postedAffirmation.backgroundFileName,
      };

      return requestedAffirmation;
    },
  );

  fastify.put<{ Params: AffirmationParams; Body: CreateAffirmation }>(
    "/:affirmation_id",
    {
      schema: {
        params: AffirmationParams,
        body: CreateAffirmation,
        response: {
          200: Affirmation,
        },
      },
    },
    async (request) => {
      const { affirmation_id } = request.params;
      const { content, category, background_file_name } = request.body;

      try {
        const [postedAffirmation] = await fastify.db
          .update(affirmation)
          .set({
            content: content,
            category: category,
            backgroundFileName: background_file_name,
            // @ts-ignore
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(affirmation.id, affirmation_id),
              // @ts-ignore
              eq(affirmation.userId, request.user.sub),
            ),
          )
          .returning();

        if (!postedAffirmation) {
          throw fastify.httpErrors.notFound(
            `Affirmation with the id of ${affirmation_id} not found.`,
          );
        }

        return {
          ...postedAffirmation,
          background_file_name: postedAffirmation.backgroundFileName,
        };
      } catch (error) {
        fastify.log.error(error);
        throw error;
      }
    },
  );

  fastify.delete<{ Params: AffirmationParams }>(
    "/:affirmation_id",
    {
      schema: {
        params: AffirmationParams,
      },
    },
    async (request) => {
      const { affirmation_id } = request.params;
      try {
        const [postedAffirmation] = await fastify.db
          .update(affirmation)
          .set({
            // @ts-ignore
            deletedAt: new Date(),
          })
          .where(
            and(
              // @ts-ignore
              eq(affirmation.userId, request.user.sub),
              eq(affirmation.id, affirmation_id),
            ),
          )
          .returning();

        if (!postedAffirmation) {
          throw fastify.httpErrors.notFound(
            `Affirmation with the id of ${affirmation_id} not found.`,
          );
        }

        return {};
      } catch (error) {
        fastify.log.error(error);
        throw error;
      }
    },
  );
};

export default affirmationsRouter;
