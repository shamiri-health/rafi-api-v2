import { Static, Type } from "@sinclair/typebox";
import { FastifyPluginAsync } from "fastify";
import { CreateUserBody, createUser } from "../../services/userService";

const schema = Type.Array(
  Type.Pick(CreateUserBody, [
    "email",
    "phone_number",
    "profession",
    "education_level",
  ]),
);

const clientIdSchema = Type.Optional(Type.Number());

type UsersSchema = {
  users: Static<typeof schema>;
  client_id: Static<typeof clientIdSchema>;
};

const supportRouter: FastifyPluginAsync = async (fastify): Promise<void> => {
  //const profession = "Healthcare Practitioners";
  // TODO: add authentication for this
  fastify.post<{ Body: UsersSchema }>(
    "/upload-users-for-client",
    { schema: { body: { users: schema, client_id: clientIdSchema } } },
    async (request) => {
      // TODO: possibility to optimise this
      const result = await fastify.db.transaction(async (trx) => {
        try {
          const createdusers = [];
          for (let newUser of request.body.users) {
            createdusers.push(
              await createUser(trx, newUser, request.body.client_id),
            );
          }
          return createdusers;
        } catch (e) {
          fastify.log.error(e);
          await trx.rollback();
        }
      });

      return result;
    },
  );
};

export default supportRouter;
