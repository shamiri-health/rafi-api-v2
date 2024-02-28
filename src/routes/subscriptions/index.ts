import { Static } from "@sinclair/typebox";
import { FastifyPluginAsync } from "fastify";
import { ResourceRequest, TokenResponse } from "../../lib/schemas";
import { eq } from "drizzle-orm";
import { user } from "../../database/schema";

type DigitalEventRequestBody = Static<typeof ResourceRequest>;

const subscriptionsRouter: FastifyPluginAsync = async (
  fastify,
): Promise<void> => {
  // FIXME: this was a stop gap for handling digital modules
  fastify.post<{ Body: DigitalEventRequestBody }>(
    "/digital-event",
    {
      schema: { body: ResourceRequest, response: { 200: TokenResponse } },
      // @ts-ignore
      onRequest: fastify.authenticate,
    },
    async (request, reply) => {
      if (request.body.resource !== "digitalEvent") {
        throw fastify.httpErrors.badRequest(
          'The only accepted value for resource field in the request body is "digitalEvent"',
        );
      }

      const token = await reply.jwtSign(
        {
          // @ts-ignore
          sub: request.user.sub,
          resourceType: request.body.resourceType ?? request.body.resource_type,
          resource: request.body.resource,
          resourceId: request.body.resourceId ?? request.body.resource_id,
        },
        { expiresIn: "60 days", algorithm: "HS256" },
      );

      const foundUser = await fastify.db.query.user.findFirst({
        // @ts-ignore
        where: eq(user.id, request.user.sub),
      });

      return {
        token,
        user: foundUser,
        authType: "payment",
      };
    },
  );
};

export default subscriptionsRouter;
