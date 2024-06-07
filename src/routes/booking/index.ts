import { and, eq, gte, isNull } from "drizzle-orm";
import { FastifyPluginAsync } from "fastify";
import { groupPlan, subscriptionV2, user } from "../../database/schema";
import {
  createOnsiteEvent,
  createTeletherapyEvent,
} from "../../lib/services/bookings/bookings";
import { formatISO } from "date-fns";

const bookingRouter: FastifyPluginAsync = async (fastify): Promise<void> => {
  // @ts-ignore
  fastify.addHook("onRequest", fastify.authenticate);

  fastify.post("/onsite", async (req) => {
    // @ts-ignore
    const userId: number = req.user.sub;

    const currentUser = await fastify.db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!currentUser) {
      throw fastify.httpErrors.notFound(`User with id: ${userId} not found`);
    }

    const existingGroupPlan = await fastify.db.query.groupPlan.findFirst({
      where: eq(groupPlan.clientId, user.clientId),
    });

    if (existingGroupPlan && existingGroupPlan.expireTime > new Date()) {
      const response = await createOnsiteEvent(fastify.db);

      return response;
    }

    const existingSubscription =
      await fastify.db.query.subscriptionV2.findFirst({
        where: and(
          eq(subscriptionV2.userId, userId),
          isNull(subscriptionV2.cancelledAt),
          gte(subscriptionV2.endDate, new Date().toISOString()),
        ),
      });

    if (!existingSubscription) {
      throw fastify.httpErrors.badRequest(
        "Cannot book an onsite session if the user does not have a valid subscription",
      );
    }

    const event = await createOnsiteEvent(fastify.db);

    if (existingSubscription.isOneOff) {
      await fastify.db
        .update(subscriptionV2)
        .set({
          endDate: formatISO(new Date(), { representation: "date" }),
        })
        .where(eq(subscriptionV2.id, existingSubscription.id));
    }

    return event;
  });

  fastify.post("/teletherapy", async (req) => {
    // @ts-ignore
    const userId: number = req.user.sub;

    const currentUser = await fastify.db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!currentUser) {
      throw fastify.httpErrors.notFound(`User with id: ${userId} not found`);
    }

    const existingGroupPlan = await fastify.db.query.groupPlan.findFirst({
      where: eq(groupPlan.clientId, user.clientId),
    });

    if (existingGroupPlan && existingGroupPlan.expireTime > new Date()) {
      const response = await createOnsiteEvent(fastify.db);

      return response;
    }

    const existingSubscription =
      await fastify.db.query.subscriptionV2.findFirst({
        where: and(
          eq(subscriptionV2.userId, userId),
          isNull(subscriptionV2.cancelledAt),
          gte(subscriptionV2.endDate, new Date().toISOString()),
        ),
      });

    if (!existingSubscription) {
      throw fastify.httpErrors.badRequest(
        "Cannot book a teletherapy session if the user does not have a valid subscription",
      );
    }

    const event = await createTeletherapyEvent(fastify.db);

    if (existingSubscription.isOneOff) {
      await fastify.db
        .update(subscriptionV2)
        .set({
          endDate: formatISO(new Date(), { representation: "date" }),
        })
        .where(eq(subscriptionV2.id, existingSubscription.id));
    }

    return event;
  });
};

export default bookingRouter;
