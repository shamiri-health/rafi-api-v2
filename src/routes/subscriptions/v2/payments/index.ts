import { Static, Type } from "@sinclair/typebox";
import { FastifyPluginAsync } from "fastify";

const MpesaCallbackResponse = Type.Object({
  Body: Type.Object({
    stkCallback: Type.Object({
      MerchantRequestID: Type.String(),
      CheckoutRequestID: Type.String(),
      ResultCode: Type.Number(),
      ResultDesc: Type.String(),
      CallbackMetadata: Type.Optional(
        Type.Object({
          Item: Type.Array(
            Type.Object({
              Name: Type.String(),
              Value: Type.Union([Type.String(), Type.Number()]),
            }),
          ),
        }),
      ),
    }),
  }),
});

type MpesaCallbackResponse = Static<typeof MpesaCallbackResponse>;

const paymentsRouter: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/purchase-subscription", async (req) => {});

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
