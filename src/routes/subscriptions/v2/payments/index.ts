import { Static, Type } from "@sinclair/typebox";
import { FastifyPluginAsync } from "fastify";
import {
  //subscriptionPayment,
  subscriptionType,
} from "../../../../database/schema";
//import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { fetchMpesaAccessToken, triggerMpesaPush } from "../../../../lib/mpesa";

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
        /*mpesaBody = */await triggerMpesaPush(accessToken, subType?.price || 1);
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
      console.log(req.body);
    },
  );
};

export default paymentsRouter;
