import { Static, Type } from "@sinclair/typebox";
import { FastifyPluginAsync } from "fastify";
import {
  human,
  subscriptionPayment,
  subscriptionType,
  subscriptionV2,
} from "../../../../database/schema";
import { eq } from "drizzle-orm";
import { fetchMpesaAccessToken, triggerMpesaPush } from "../../../../lib/mpesa";
import { randomUUID } from "node:crypto";
import { addDays, addMonths, formatISO } from "date-fns";
import { customAlphabet } from "nanoid";
import { isValidPhoneNumber } from "libphonenumber-js";

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

      if (!subType) {
        throw fastify.httpErrors.notFound(
          "Could not find a subscription type with the given ID",
        );
      }

      const user = await fastify.db.query.human.findFirst({
        // @ts-ignore
        where: eq(human.id, req.user.sub),
      });

      if (!user) {
        throw fastify.httpErrors.notFound(
          "Could not initiate purchase subscription for non-existent user",
        );
      }

      if (!user?.mobile || !isValidPhoneNumber(user?.mobile, "KE")) {
        throw fastify.httpErrors.notFound(
          "Only Kenyan phone numbers supported for MPESA payment method",
        );
      }

      let accessToken: string;
      try {
        accessToken = await fetchMpesaAccessToken();
      } catch (e: any) {
        fastify.log.error(e.message);
        throw fastify.httpErrors.internalServerError(
          "Could not fetch access token for MPESA",
        );
      }

      const nanoid = customAlphabet("23456789ABCDEFGHJKLMNOPQRSTUVWXYZ", 10);
      const paymentShortCode = nanoid();

      let mpesaBody: Awaited<ReturnType<typeof triggerMpesaPush>>;
      try {
        mpesaBody = await triggerMpesaPush(
          accessToken,
          subType?.price,
          user.mobile?.replace("+", ""),
          paymentShortCode,
        );
      } catch (e: any) {
        fastify.log.error(e.message);
        throw fastify.httpErrors.internalServerError(
          "Could not complete the STK push",
        );
      }

      // TODO: need to save this MPESA ref in the payments table
      await fastify.db.insert(subscriptionPayment).values({
        id: randomUUID(),
        subscriptionTypeId: subType.id,
        amountPaid: subType.price,
        // @ts-ignore
        userId: req.user.sub,
        paymentTimestamp: new Date(),
        paymentMethod: "MPESA",
        paymentShortCode: paymentShortCode,
        status: "PENDING",
        mpesaRef: mpesaBody.CheckoutRequestID,
        metaData: mpesaBody,
      });

      return {
        message: "MPESA transaction successfully initiated",
      };
    },
  );

  // this should only whitelist the APIs from safaricom
  fastify.post<{ Body: MpesaCallbackResponse }>(
    "/mpesa-callback",
    {
      onRequest: (req, _, done) => {
        // https://developer.safaricom.co.ke/Documentation
        // read in the going live section

        const SAF_IPs = [
          "196.201.214.200",
          "196.201.214.206",
          "196.201.213.114",
          "196.201.214.207",
          "196.201.214.208",
          "196.201.213.44",
          "196.201.212.127",
          "196.201.212.138",
          "196.201.212.129",
          "196.201.212.136",
          "196.201.212.74",
          "196.201.212.69",
        ];

        if (!SAF_IPs.includes(req.ip)) {
          fastify.log.error(
            `Unauthorized attempt to access the STK callback endpoint from ${req.ip}`,
          );
          throw fastify.httpErrors.unauthorized();
        }

        done();
      },
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
            updatedAt: new Date(),
            status: "FAILED",
          })
          .where(eq(subscriptionPayment.mpesaRef, checkoutRequestId));

        fastify.log.warn(
          `Failed MPESA transaction with checkout request ID ${checkoutRequestId}: ${req.body.Body.stkCallback.ResultDesc}`,
        );
        return {};
      }

      const [updatedPayment] = await fastify.db
        .update(subscriptionPayment)
        .set({
          updatedAt: new Date(),
          status: "PAID",
        })
        .where(eq(subscriptionPayment.mpesaRef, checkoutRequestId))
        .returning();

      const [paymentRecord] = paymentRecordResult;

      let isOneOff = false;
      const startDate = new Date();
      let endDate = null;

      // end date computation to follow billing anchor as per Stripe's documentation
      // https://docs.stripe.com/billing/subscriptions/billing-cycle
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
      } else if (paymentRecord.subscription_type.isOneOff) {
        isOneOff = true;
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
        isOneOff,
        endDate: endDate
          ? formatISO(endDate, { representation: "date" })
          : endDate,
      });

      return {};
    },
  );
};

export default paymentsRouter;
