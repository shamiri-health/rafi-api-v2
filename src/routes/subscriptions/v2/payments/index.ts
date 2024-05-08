import { Static, Type } from "@sinclair/typebox";
import { format } from "date-fns";
import { FastifyPluginAsync } from "fastify";
import {
  subscriptionPayment,
  subscriptionType,
} from "../../../../database/schema";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";

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
  // TODO: return to POST
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
      // base64 string of CONSUMER_KEY + : + CONSUMER_SECRET
      const subType = await fastify.db.query.subscriptionType.findFirst({
        where: eq(subscriptionType.id, req.body.subscription_type_id),
      });

      if (!subType) {
        throw fastify.httpErrors.notFound(
          "Could not find a subscription type with the given ID",
        );
      }

      const tokenAuth = btoa(
        `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`,
      );

      const accessTokenResponse = await fetch(
        "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
        {
          headers: {
            Authorization: `Basic ${tokenAuth}`,
          },
          method: "GET",
        },
      );

      if (!accessTokenResponse.ok) {
        fastify.log.error("Could not fetch safaricom authentication token");
        throw fastify.httpErrors.internalServerError(
          "Sorry, the MPESA request could not be completed at this time",
        );
      }

      const accessTokenBody: { access_token: string; expires_in: string } =
        await accessTokenResponse.json();

      const timestamp = format(new Date(), "yyyyMMddHHmmss");

      // A base64 encoded string. (The base64 string is a combination of Shortcode+Passkey+Timestamp)
      const password = btoa(
        `${process.env.MPESA_SHORTCODE}${process.env.DARAJA_PASSKEY}${timestamp}`,
      );

      const body = JSON.stringify({
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: subType.price,
        PartyA: "254717266218",
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: "254717266218",
        CallBackURL:
          "https://cnet-comp-certificate-montreal.trycloudflare.com/subscriptions/v2/payments/mpesa-callback",
        AccountReference: "Test",
        TransactionDesc: "Test",
      });

      const res = await fetch(
        "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessTokenBody.access_token}`,
          },
          method: "POST",
          body,
        },
      );

      if (!res.ok) {
        fastify.log.error(res.statusText);
        throw fastify.httpErrors.internalServerError(
          "Could not process MPESA payment request at this time",
        );
      }

      type MpesaResponse = {
        MerchantRequestID: string;
        CheckoutRequestID: string;
        ResponseCode: string;
        ResponseDescription: string;
        CustomerMessage: string;
      };

      const mpesaBody: MpesaResponse = await res.json();

      if (mpesaBody.ResponseCode !== "0") {
        // the transaction cannot be initiated or there was an error
        // see: https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate
        fastify.log.error(mpesaBody.ResponseDescription);
        throw fastify.httpErrors.internalServerError(
          "Could not process MPESA payment request at this time",
        );
      }

      // TODO: need to save this MPESA ref in the payments table
      await fastify.db.insert(subscriptionPayment).values({
        id: randomUUID(),
        subscriptionTypeId: subType.id,
        amountPaid: subType.price,
        paymentTimestamp: new Date(),
        paymentMethod: "MPESA",
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
