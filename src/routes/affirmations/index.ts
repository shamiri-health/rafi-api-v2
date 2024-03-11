import { FastifyPluginAsync } from "fastify";
import { and, eq, isNull } from "drizzle-orm";
import { shuffle } from "lodash";
import { randomUUID } from "crypto";
import { Static, Type } from "@sinclair/typebox";
import Affirmations from "../../../static/affirmations.json";
import { affirmation, affirmationOfTheDay } from "../../schema";

const CATEGORIES = Object.keys(Affirmations);
const AFFIRMATIONBANK: AffirmationObj = Affirmations;

interface AffirmationObj {
    [category: string]: {
        [subCategory: string]: string[]
    }
}

const AffirmationOfTheDay = Type.Object({
    id: Type.String(),
    created_at: Type.String({ format: "date-time" }),
    updated_at: Type.String({ format: "date-time" }),
    user_id: Type.Integer(),
    category: Type.String(),
    sub_category: Type.String(),
    affirmation: Type.String()
})

const RecommendedAffirmation = Type.Object({
    category: Type.String(),
    sub_category: Type.String(),
    affirmation: Type.Array(Type.String())
})

const Affirmation = Type.Object({
    id: Type.String(),
    content: Type.String(),
    createdAt: Type.String({ format: "date-time" }),
    updatedAt: Type.String({ format: "date-time" }),
    background_file_name: Type.String(),
    userId: Type.Integer()
})

const CreateAffirmation = Type.Object({
    content: Type.String(),
    category: Type.String(),
    background_file_name: Type.String()
})

const AffirmationParams = Type.Object({
    affirmation_id: Type.String()
})

type CreateAffirmation = Static<typeof CreateAffirmation>;
type AffirmationParams = Static<typeof AffirmationParams>;
type Affirmation = Static<typeof Affirmation>;
type RecommendedAffirmation = Static<typeof RecommendedAffirmation>;
type AffirmationOfTheDay = Static<typeof AffirmationOfTheDay>;


const affirmationsRouter: FastifyPluginAsync = async (fastify, _): Promise<void> => {
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
    })

    fastify.get("/affirmation-of-the-day", {
        schema: {
            response: {
                200: AffirmationOfTheDay
            }
        }
    }, async (request, reply) => {
        const createdAffirmation = await fastify.db.query.affirmationOfTheDay.findFirst({
            where: and(
                // @ts-ignore
                eq(affirmationOfTheDay.userId, request.user.sub),
            )
            // .filter(
//             models.AffirmationOfTheDay.user_id == user_id,
//             func.DATE(models.AffirmationOfTheDay.created_at) == todays_date,
//         )
        })

        if (createdAffirmation) {
            return reply.send(createdAffirmation)
        }

        const category = shuffle(CATEGORIES);
        const subCategory = Object.keys(AFFIRMATIONBANK[category[0]]);
        const affirmation = shuffle(AFFIRMATIONBANK[category[0]][subCategory[0]]);

        try {
            const newAffirmation = await fastify.db
            .insert(affirmationOfTheDay)
            .values({
                id: randomUUID(),
                category: category[0],
                subCategory: subCategory[0],
                // @ts-ignore
                userId: request.user.sub,
                affirmation: affirmation[0],
            }).returning();

            return reply.code(201).send(newAffirmation);
        } catch (error) {
            fastify.log.error(error);
            throw error;
        }
    })

    fastify.get("/recommended-for-you", {
        schema: {
            response: {
                200: RecommendedAffirmation
            }
        }
    }, async (_, reply) => {
        const categories = shuffle(CATEGORIES).slice(0, 3);
        const response = [];
        for (const category of categories) {
            const subCategories = shuffle(Object.keys(AFFIRMATIONBANK[category]));
            const affirmation = AFFIRMATIONBANK[category][subCategories[0]];

            response.push({
                category: category,
                sub_category: subCategories[0],
                affirmation: affirmation
            })
        }
        return reply.send(response);
    })

    fastify.get("/", {
        schema: {
            response: {
                200: Type.Array(Affirmation)
            }
        }
    }, async (request, reply) => {
        const postedAffirmations = await fastify.db.query.affirmation.findMany({
            where: and(
                // @ts-ignore
                eq(affirmation.userId, request.user.sub),
                isNull(affirmation.deletedAt)
            )
        })
        const affirmations = [];

        for (const affirmation of postedAffirmations) {
            const myAffirmation = {
                id: affirmation.id,
                content: affirmation.content,
                category: affirmation.category,
                createdAt: affirmation.createdAt,
                updatedAt: affirmation.updatedAt,
                background_file_name: affirmation.backgroundFileName,
                userId: affirmation.userId
            }

            affirmations.push(myAffirmation);
        }

        return reply.send(affirmations);
    })

    fastify.post<{ Body: CreateAffirmation }>("/", {
        schema: {
            body: CreateAffirmation,
            response: {
                201: Affirmation
            }
        }
    }, async (request, reply) => {
        const { content, category, background_file_name } = request.body;
        const validCategory = CATEGORIES.find(cat => cat.includes(category));
        
        if (!validCategory) {
            throw fastify.httpErrors.notFound(
                "The category choice is invalid"
            )
        }

        try {
            const [postedAffirmation] = await fastify.db
            .insert(affirmation)
            .values({
                // @ts-ignore
                id: randomUUID(),
                category: category,
                content: content,
                backgroundFileName: background_file_name,
                // @ts-ignore
                userId: request.user.sub,
                createdAt: new Date(),
                updatedAt: new Date()
            }).returning();

            const newAffirmation = {
                id: postedAffirmation.id,
                content: postedAffirmation.content,
                category: postedAffirmation.category,
                createdAt: postedAffirmation.createdAt,
                updatedAt: postedAffirmation.updatedAt,
                background_file_name: postedAffirmation.backgroundFileName,
                userId: postedAffirmation.userId
            }

            return reply.code(201).send(newAffirmation);
        } catch (error) {
            fastify.log.error(error);
            throw error;
        }
    })

    fastify.get<{ Params: AffirmationParams }>("/:affirmation_id", {
        schema: {
            params: AffirmationParams,
            response: {
                200: Affirmation
            }
        }
    }, async (request, reply) => {
        const { affirmation_id } = request.params;
        const postedAffirmation = await fastify.db.query.affirmation.findFirst({
            where: and(
                // @ts-ignore
                eq(affirmation.userId, request.user.sub),
                eq(affirmation.id, affirmation_id)
            )
        })

        if (!postedAffirmation) {
            throw fastify.httpErrors.notFound(
                `Affirmation with the id of ${affirmation_id} not found.`
            )
        }

        const requestedAffirmation = {
            id: postedAffirmation.id,
            content: postedAffirmation.content,
            category: postedAffirmation.category,
            createdAt: postedAffirmation.createdAt,
            updatedAt: postedAffirmation.updatedAt,
            background_file_name: postedAffirmation.backgroundFileName,
            userId: postedAffirmation.userId
        }

        return reply.send(requestedAffirmation);
    })

    fastify.put<{ Params: AffirmationParams, Body: CreateAffirmation }>("/:affirmation_id", 
        {
            schema: {
                params: AffirmationParams,
                body: CreateAffirmation
            }
        }, async (request, reply) => {
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
                    updatedAt: new Date()
                })
                .where(
                    and(
                        eq(affirmation.id, affirmation_id),
                        // @ts-ignore
                        eq(affirmation.userId, request.user.sub)
                    )
                ).returning();

                if (!postedAffirmation) {
                    throw fastify.httpErrors.notFound(
                        `Affirmation with the id of ${affirmation_id} not found.`
                    )
                }

                return reply.send(postedAffirmation)
            } catch (error) {
                fastify.log.error(error);
                throw error;
            }
        }
    )

    fastify.delete<{ Params: AffirmationParams }>("/:affirmation_id", {
            schema: {
                params: AffirmationParams,
            }
        },
        async (request, reply) => {
            const { affirmation_id } = request.params;
            try {
                const [postedAffirmation] = await fastify.db
                .update(affirmation)
                .set({
                    // @ts-ignore
                    deletedAt: new Date()
                })
                .where(
                    and(
                        // @ts-ignore
                        eq(affirmation.userId, request.user.sub),
                        eq(affirmation.id, affirmation_id)
                    )
                ).returning();

                if (!postedAffirmation) {
                    throw fastify.httpErrors.notFound(
                        `Affirmation with the id of ${affirmation_id} not found.`
                    )
                }

                return reply.send({})
            } catch (error) {
                fastify.log.error(error);
                throw error;
            }
        }
    )
}

export default affirmationsRouter;
