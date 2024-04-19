import { Type } from "@sinclair/typebox";
import { FastifyPluginAsync } from "fastify";

const schema = Type.Array(
  Type.Object({
    email: Type.String({ format: "email" }),
    phone_number: Type.String(),
  }),
);

const supportRouter: FastifyPluginAsync = async (fastify): Promise<void> => {
  //const profession = "Healthcare Practitioners";
  // TODO: add authentication for this
  fastify.post(
    "/upload-ahn",
    { schema: { body: { users: schema } } },
    async (request) => {},
  );
};

export default supportRouter;
