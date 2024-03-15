import { and, isNull, eq } from "drizzle-orm";
import { FastifyPluginAsync } from "fastify";
import { favouritedAffirmation } from "../../schema";
import Affirmations from "../../../static/affirmations.json";
import { randomUUID } from "crypto";
import { Type, Static } from "@sinclair/typebox";

interface AffirmationObj {
    [category: string]: {
        [subCategory: string]: string[]
    }
}

const CreateFavouriteAffirmation = Type.Object({
    category: Type.String(),
})

const FavouriteAffirmationParams = Type.Object({
    affirmation_id: Type.String()
})

const FavouriteAffirmation = Type.Object({
    id: Type.String(),
    created_at: Type.String({ format: "date-time" }),
    updated_at: Type.String({ format: "date-time" }),
    removed_at: Type.Optional(Type.String({ format: "date-time" })),
    category: Type.String(),
    user_id: Type.Integer(),
    affirmations: Type.Optional(Type.Array(Type.String()))
})

type FavouriteAffirmation = Static<typeof FavouriteAffirmation>;
type FavouriteAffirmationParams = Static<typeof FavouriteAffirmationParams>;
type CreateFavouriteAffirmation = Static<typeof CreateFavouriteAffirmation>;

const AFFIRMATIONBANK: AffirmationObj = Affirmations;

const favouriteAffirmations: FastifyPluginAsync = async (fastify, _): Promise<void> => {
    // @ts-ignore
    fastify.addHook("onRequest", fastify.authenticate)

    fastify.get("/", 
        {
            schema: {
                response: {
                    200: Type.Array(FavouriteAffirmation)
                }
            }
        }, 
        async (request, reply) => {
            const favourites = await fastify.db.query.favouritedAffirmation.findMany({
                where: and(
                    // @ts-ignore
                    eq(favouritedAffirmation.userId, request.user.sub),
                    isNull(favouritedAffirmation.removedAt)
                )
            })
            const favouriteAffirmations = [];
            for (const favourite of favourites) {
                let selectedAffirmation;
                if (favourite.category) {
                    for (const key of Object.keys(AFFIRMATIONBANK)) {
                        const category = AFFIRMATIONBANK[key];
                        if (category && category[favourite.category]) {
                            const affirmation = category[favourite.category]
                            selectedAffirmation = affirmation;
                            break;
                        }
                    }
                }
                const favAffirmation = {
                    ...favourite,
                    created_at: favourite.createdAt,
                    updated_at: favourite.updatedAt,
                    user_id: favourite.userId,
                    removed_at: favourite.removedAt,
                    affirmations: selectedAffirmation
                }
                favouriteAffirmations.push(favAffirmation);  
            }
        
            return reply.send(favouriteAffirmations);
        }
    )

    fastify.post<{ Body: CreateFavouriteAffirmation }>("/", 
        {
            schema: {
                body: CreateFavouriteAffirmation,
                response: {
                    201: FavouriteAffirmation
                }
            }
        }, async (request, reply) => {
            try {
                const { category } = request.body;

                const [favAffirmation] = await fastify.db
                .insert(favouritedAffirmation)
                .values({
                    // @ts-ignore
                    userId: request.user.sub,
                    id: randomUUID(),
                    category: category,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }).returning()

                return reply.code(201).send({
                    ...favAffirmation,
                    created_at: favAffirmation.createdAt,
                    updated_at: favAffirmation.updatedAt,
                    user_id: favAffirmation.userId
                });

            } catch (error) {
                fastify.log.error(error);
                throw error;
            }
        }
    )

    fastify.delete<{ Params: FavouriteAffirmationParams }>("/:affirmation_id",  
        async (request, reply) => {
            const { affirmation_id } = request.params;
            const [favouriteAffirmation] = await fastify.db
            .update(favouritedAffirmation)
            .set({
                // @ts-ignore
                removedAt: new Date()
            })
            .where(
                and(
                    // @ts-ignore
                    eq(favouritedAffirmation.userId, request.user.sub),
                    eq(favouritedAffirmation.id, affirmation_id)
                )
            ).returning();

            if (!favouriteAffirmation) {
                throw fastify.httpErrors.notFound(
                    `Affirmation with the id of ${affirmation_id} not found.`
                )
            }

            return reply.send({})
        }
    )
}

export default favouriteAffirmations;
