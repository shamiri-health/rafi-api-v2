import { and, desc, eq } from "drizzle-orm";
import { FastifyPluginAsync } from "fastify";
import { subscriptionV2 } from "../../../database/schema";
import { Static, Type } from "@sinclair/typebox";

const Params = Type.Object({
  subscriptionId: Type.String(),
});

type Params = Static<typeof Params>;

const subscriptionsRouters: FastifyPluginAsync = async (
  fastify,
): Promise<void> => {
  // @ts-ignore
  fastify.get("/", { onRequest: fastify.authenticate }, async (req) => {
    // @ts-ignore
    const userId = req.user.sub;

    // this query could also do comparisons to check if the subscription is valid...or offload to the frontend
    const subscription = await fastify.db.query.subscriptionV2.findFirst({
      where: eq(subscriptionV2.userId, userId),
      orderBy: desc(subscriptionV2.endDate),
    });

    // TODO: align on format to check if user has a valid subscription, throw a 404 error or just return an empty object
    // for now it will return an empty object

    if (!subscription) {
      return {};
    }

    return subscription;
  });

  fastify.post<{ Params: Params }>(
    "/:subscriptionId/cancel-subscription",
    {
      // @ts-ignore
      onRequest: fastify.authenticate,
      schema: {
        params: Params,
      },
    },
    async (req) => {
      // @ts-ignore
      const userId = req.user.sub;

      const subscription = await fastify.db.query.subscriptionV2.findFirst({
        where: and(
          eq(subscriptionV2.id, req.params.subscriptionId),
          eq(subscriptionV2.userId, userId),
        ),
      });

      if (!subscription) {
        throw fastify.httpErrors.notFound(
          "Could not find the subscription belonging to the user",
        );
      }

      const [cancelledSubscription] = await fastify.db
        .update(subscriptionV2)
        .set({
          cancelledAt: new Date(),
        })
        .where(eq(subscriptionV2.id, req.params.subscriptionId))
        .returning();

      return cancelledSubscription;
    },
  );
};

export default subscriptionsRouters;
