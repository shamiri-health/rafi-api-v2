import { join } from "path";
import AutoLoad, { AutoloadPluginOptions } from "@fastify/autoload";
import { FastifyPluginAsync, FastifyServerOptions } from "fastify";
import fastifySwagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import fp from "fastify-plugin";
import { FastifyJwtNamespace } from "@fastify/jwt";

export interface AppOptions
  extends FastifyServerOptions,
    Partial<AutoloadPluginOptions> {}
// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {};

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts,
): Promise<void> => {
  // Place here your custom code!
  void fastify.register(fastifySwagger, {});
  void fastify.register(swaggerUI, {
    routePrefix: "/documentation",
    uiConfig: {
      docExpansion: "full",
      deepLinking: false,
    },
    uiHooks: {
      onRequest: function (request, reply, next) {
        next();
      },
      preHandler: function (request, reply, next) {
        next();
      },
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, request, reply) => {
      return swaggerObject;
    },
    transformSpecificationClone: true,
  });

  void fastify.register(require("@fastify/jwt"), {
    secret: process.env.JWT_SECRET,
    sign: {
      algorithm: "HS256",
    },
  });

  void fastify.register(require("@immobiliarelabs/fastify-sentry"), {
    dsn: "https://4989545f44cb88b83409514052875b25@o1375952.ingest.us.sentry.io/4506807502110720",
  });

  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  void fastify.register(AutoLoad, {
    dir: join(__dirname, "plugins"),
    options: opts,
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  void fastify.register(AutoLoad, {
    dir: join(__dirname, "routes"),
    options: opts,
  });
};

export default fp(app);
export { app, options };

declare module "fastify" {
  interface FastifyInstance
    extends FastifyJwtNamespace<{ namespace: "security" }> {}
}
