import { and, eq, gte, isNull } from "drizzle-orm";
import { FastifyPluginAsync } from "fastify";
import { groupPlan, subscriptionV2, user } from "../../database/schema";
import {
  createOnsiteEvent,
  //   // createTeletherapyEvent,
} from "../../lib/services/bookings/bookings";
//import { formatISO } from "date-fns";
import { Static, Type } from "@sinclair/typebox";

const EventBody = Type.Object({
  start_time: Type.String({ format: "date-time" }),
  end_time: Type.String({ format: "date-time" }),
  therapist_id: Type.Optional(Type.String()),
  event_id: Type.Optional(Type.String()),
  data_privacy_list: Type.Array(Type.String()),
});

type EventBody = Static<typeof EventBody>;

const bookingRouter: FastifyPluginAsync = async (fastify): Promise<void> => {
  // @ts-ignore
  fastify.addHook("onRequest", fastify.authenticate);

  fastify.post<{ Body: EventBody }>(
    "/onsite",
    { schema: { body: EventBody } },
    async (req) => {
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
        if (req.body.event_id) {
          // return await updateOnsiteEvent(fastify.db, currentUser.id, req.body.event_id, new Date(req.body.start_time), new Date(req.body.end_time))
          // update onsite event
          // return event
        }

        return await createOnsiteEvent(
          fastify.db,
          currentUser.id,
          currentUser.alias || "",
          new Date(req.body.start_time),
          new Date(req.body.end_time),
          req.body.data_privacy_list,
        );
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
          "Cannot book an onsite session if the user does not have a valid subscription or group plan",
        );
      }
      //
      // let event;
      // if (req.body.event_id) {
      //   // update onsite event
      //   // update event
      // } else {
      //   event = await createOnsiteEvent(
      //     fastify.db,
      //     currentUser.id,
      //     currentUser.alias || "",
      //     new Date(req.body.start_time),
      //     new Date(req.body.end_time),
      //     req.body.data_privacy_list,
      //   );
      // }
      //
      // // cleanup existing subscription if it's a one-off
      // if (existingSubscription.isOneOff) {
      //   await fastify.db
      //     .update(subscriptionV2)
      //     .set({
      //       endDate: formatISO(new Date(), { representation: "date" }),
      //     })
      //     .where(eq(subscriptionV2.id, existingSubscription.id));
      // }
      //
      // return event;
      return {};
    },
  );

  // fastify.post("/teletherapy", async (req) => {
  //   // @ts-ignore
  //   const userId: number = req.user.sub;
  //
  //   const currentUser = await fastify.db.query.user.findFirst({
  //     where: eq(user.id, userId),
  //   });
  //
  //   if (!currentUser) {
  //     throw fastify.httpErrors.notFound(`User with id: ${userId} not found`);
  //   }
  //
  //   const existingGroupPlan = await fastify.db.query.groupPlan.findFirst({
  //     where: eq(groupPlan.clientId, user.clientId),
  //   });
  //
  //   if (existingGroupPlan && existingGroupPlan.expireTime > new Date()) {
  //     const response = await createOnsiteEvent(fastify.db);
  //
  //     return response;
  //   }
  //
  //   const existingSubscription =
  //     await fastify.db.query.subscriptionV2.findFirst({
  //       where: and(
  //         eq(subscriptionV2.userId, userId),
  //         isNull(subscriptionV2.cancelledAt),
  //         gte(subscriptionV2.endDate, new Date().toISOString()),
  //       ),
  //     });
  //
  //   if (!existingSubscription) {
  //     throw fastify.httpErrors.badRequest(
  //       "Cannot book a teletherapy session if the user does not have a valid subscription",
  //     );
  //   }
  //
  //   const event = await createTeletherapyEvent(fastify.db);
  //
  //   if (existingSubscription.isOneOff) {
  //     await fastify.db
  //       .update(subscriptionV2)
  //       .set({
  //         endDate: formatISO(new Date(), { representation: "date" }),
  //       })
  //       .where(eq(subscriptionV2.id, existingSubscription.id));
  //   }
  //
  //   return event;
  // });
};

export default bookingRouter;
