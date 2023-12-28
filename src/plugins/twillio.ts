// TODO: should be stubbed by sinon when testing
import twillio from "twilio";
import fp from "fastify-plugin";

export const twilioClient = twillio(
  process.env.TWILLIO_ACCOUNT_SID,
  process.env.TWILLIO_AUTH_TOKEN,
  { autoRetry: true, maxRetries: 10 },
);

export default fp(async (fastify, _) => {
  fastify.decorate("twilio", twilioClient);
});

declare module "fastify" {
  export interface FastifyInterface {
    twilio: typeof twilioClient;
  }
}
