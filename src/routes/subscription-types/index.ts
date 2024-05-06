import { FastifyPluginAsync } from "fastify";
import { subscriptionType } from "../../database/schema";
import { Static, Type } from "@sinclair/typebox";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";

const SubscriptionTypeSchema = Type.Object({
  description: Type.String(),
  price: Type.Number(),
  duration_days: Type.Optional(Type.Integer()),
  duration_months: Type.Optional(Type.Integer()),
});

const ParamsSchema = Type.Object({
  subscriptionTypeId: Type.String(),
});

type SubscriptionTypeSchema = Static<typeof SubscriptionTypeSchema>;
type ParamsSchema = Static<typeof ParamsSchema>;

// TODO: these endpoints need to be hidden by an admin auth
const subscriptionTypesRouter: FastifyPluginAsync = async (
  fastify,
  _,
): Promise<void> => {
  fastify.get("/", async () => {
    const subscriptionTypes =
      await fastify.db.query.subscriptionType.findMany();
    return subscriptionTypes;
  });

  fastify.post<{ Body: SubscriptionTypeSchema }>(
    "/",
    {
      schema: {
        body: SubscriptionTypeSchema,
      },
    },
    async (req) => {
      if (!req.body.duration_months && !req.body.duration_days) {
        throw fastify.httpErrors.badRequest(
          "Please supply one of duration_days or duration_months",
        );
      }

      const body: typeof subscriptionType.$inferInsert = {
        id: randomUUID(),
        durationDays: req.body.duration_days ?? undefined,
        durationMonths: req.body.duration_months ?? undefined,
        price: req.body.price,
        description: req.body.description,
      };
      const [newSubscriptionType] = await fastify.db
        .insert(subscriptionType)
        .values(body)
        .returning();

      return newSubscriptionType;
    },
  );

  fastify.post<{ Params: ParamsSchema }>(
    "/:subscriptionTypeId/archive",
    async (req) => {
      const { subscriptionTypeId } = req.params;

      const existingSubscriptionType =
        await fastify.db.query.subscriptionType.findFirst({
          where: eq(subscriptionType.id, subscriptionTypeId),
        });

      if (!existingSubscriptionType) {
        throw fastify.httpErrors.notFound(
          "Could not find a subscription type with the given id",
        );
      }

      if (existingSubscriptionType.archivedAt) {
        throw fastify.httpErrors.badRequest(
          "Could not archive and already archived subscription type",
        );
      }

      const [archivedSubscription] = await fastify.db
        .update(subscriptionType)
        .set({
          archivedAt: new Date(),
        })
        .returning();

      return archivedSubscription;
    },
  );
};

export default subscriptionTypesRouter;
