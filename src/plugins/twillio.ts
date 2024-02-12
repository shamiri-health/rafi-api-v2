import fp from "fastify-plugin";
import twillioClient from "../lib/sms";

export default fp(async (fastify, _) => {
  fastify.decorate("twilio", twillioClient);
});

declare module "fastify" {
  export interface FastifyInterface {
    twilio: typeof twillioClient;
  }
}
