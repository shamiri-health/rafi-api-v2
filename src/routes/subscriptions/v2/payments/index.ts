import { Static, Type } from "@sinclair/typebox";
import { FastifyPluginAsync } from "fastify";
import {
  subscriptionPayment,
  subscriptionType,
  subscriptionV2,
} from "../../../../database/schema";
import { eq } from "drizzle-orm";
import { fetchMpesaAccessToken, triggerMpesaPush } from "../../../../lib/mpesa";
import { randomUUID } from "node:crypto";
import { addDays, addMonths, formatISO } from "date-fns";

const PurchaseSubscriptionBody = Type.Object({
  subscription_type_id: Type.String(),
});

const MpesaCallbackResponse = Type.Object({
  Body: Type.Object({
    stkCallback: Type.Object({
      MerchantRequestID: Type.String(),
      CheckoutRequestID: Type.String(),
      ResultCode: Type.Number(),
      ResultDesc: Type.String(),
      CallbackMetadata: Type.Optional(
        Type.Any(),
        /*
        Type.Object({
          Item: Type.Array(
            Type.Object({
              Name: Type.String(),
              Value: Type.Union([Type.String(), Type.Number()]),
            }),
          ),
        }),
        */
      ),
    }),
  }),
});

type PurchaseSubscriptionBody = Static<typeof PurchaseSubscriptionBody>;
type MpesaCallbackResponse = Static<typeof MpesaCallbackResponse>;

const paymentsRouter: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post<{ Body: PurchaseSubscriptionBody }>(
    "/purchase-subscription",
    {
      // @ts-ignore
      onRequest: fastify.authenticate,
      schema: {
        body: PurchaseSubscriptionBody,
      },
    },
    async (req) => {
      const subType = await fastify.db.query.subscriptionType.findFirst({
        where: eq(subscriptionType.id, req.body.subscription_type_id),
      });

      // if (!subType) {
      //   throw fastify.httpErrors.notFound(
      //     "Could not find a subscription type with the given ID",
      //   );
      // }

      let accessToken: string;
      try {
        accessToken = await fetchMpesaAccessToken();
      } catch (e: any) {
        fastify.log.error(e.message);
        throw fastify.httpErrors.internalServerError(
          "Could not fetch access token for MPESA",
        );
      }

      //let mpesaBody: Awaited<ReturnType<typeof triggerMpesaPush>>;
      try {
        /*mpesaBody = */ await triggerMpesaPush(
          accessToken,
          subType?.price || 1,
        );
      } catch (e: any) {
        fastify.log.error(e.message);
        throw fastify.httpErrors.internalServerError(
          "Could not complete the STK push",
        );
      }

      // TODO: need to save this MPESA ref in the payments table
      // await fastify.db.insert(subscriptionPayment).values({
      //   id: randomUUID(),
      //   subscriptionTypeId: subType.id,
      //   amountPaid: subType.price,
      //   userId: request.user.sub,
      //   paymentTimestamp: new Date(),
      //   paymentMethod: "MPESA",
      //   status: "PENDING",
      //   mpesaRef: mpesaBody.CheckoutRequestID,
      //   metaData: mpesaBody,
      // });

      return {
        message: "MPESA transaction successfully initiated",
      };
    },
  );

  // this should only whitelist the APIs from safaricom
  fastify.post<{ Body: MpesaCallbackResponse }>(
    "/mpesa-callback",
    {
      schema: {
        body: MpesaCallbackResponse,
      },
    },
    async (req) => {
      const {
        Body: {
          stkCallback: { CheckoutRequestID: checkoutRequestId },
        },
      } = req.body;

      const paymentRecordResult = await fastify.db
        .select()
        .from(subscriptionPayment)
        .innerJoin(
          subscriptionType,
          eq(subscriptionPayment.subscriptionTypeId, subscriptionType.id),
        );

      if (!paymentRecordResult.length) {
        fastify.log.error(req.body);
        fastify.log.error(
          "Missed payment request received, Please check database records and MPESA portal for possible refund or correction",
        );
        return {};
      }
      if (req.body.Body.stkCallback.ResultCode !== 0) {
        await fastify.db
          .update(subscriptionPayment)
          .set({
            status: "FAILED",
          })
          .where(eq(subscriptionPayment.mpesaRef, checkoutRequestId));
        fastify.log.warn(
          `Failed MPESA transaction with checkout request ID: ${checkoutRequestId}`,
        );
        return {};
      }

      const [updatedPayment] = await fastify.db
        .update(subscriptionPayment)
        .set({
          status: "PAID",
        })
        .where(eq(subscriptionPayment.mpesaRef, checkoutRequestId))
        .returning();

      const [paymentRecord] = paymentRecordResult;

      const startDate = new Date();
      let endDate;

      if (paymentRecord.subscription_type.durationDays) {
        endDate = addDays(
          startDate,
          paymentRecord.subscription_type.durationDays,
        );
      } else if (paymentRecord.subscription_type.durationMonths) {
        endDate = addMonths(
          startDate,
          paymentRecord.subscription_type.durationMonths,
        );
      } else {
        fastify.log.error(
          "A subscription type was created without a valid duration. A subscription type can only have days specified or months specified",
        );
        fastify.log.error(
          "Kindly ensure that the subscription type associated with this payment is correct",
        );
        throw fastify.httpErrors.internalServerError(
          "Could not process payment",
        );
      }

      // create new subscription
      await fastify.db.insert(subscriptionV2).values({
        id: randomUUID(),
        userId: updatedPayment.userId,
        subscriptionTypeId: paymentRecord.subscription_type.id,
        startDate: formatISO(startDate, { representation: "date" }),
        endDate: formatISO(endDate, { representation: "date" }),
      });
    },
  );
};

export default paymentsRouter;
