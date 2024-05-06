import { FastifyPluginAsync } from "fastify";
import { subscriptionType } from "../../database/schema";
import { Static, Type } from "@sinclair/typebox";
import { randomUUID } from "node:crypto";

const SubscriptionTypeSchema = Type.Object({
  description: Type.String(),
  duration_days: Type.Optional(Type.Integer()),
  duration_months: Type.Optional(Type.Integer()),
});

const UpdateSchema = Type.Composite([
  Type.Pick(SubscriptionTypeSchema, ["duration_days", "duration_months"]),
  Type.Object({
    description: Type.Optional(Type.String()),
  }),
]);

const ParamsSchema = Type.Object({
  subscriptionTypeId: Type.String(),
});

type SubscriptionTypeSchema = Static<typeof SubscriptionTypeSchema>;
type UpdateSchema = Static<typeof UpdateSchema>;
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
      const [newSubscriptionType] = await fastify.db
        .insert(subscriptionType)
        .values({
          ...req.body,
          id: randomUUID(),
        })
        .returning();

      return newSubscriptionType;
    },
  );

  fastify.patch<{ Body: UpdateSchema; Params: ParamsSchema }>(
    "/:subscriptionTypeId",
    {
      schema: {
        params: ParamsSchema,
        body: UpdateSchema,
      },
    },
    async (req) => {
      const { subscriptionTypeId } = req.params;
    },
  );
};

export default subscriptionTypesRouter;
