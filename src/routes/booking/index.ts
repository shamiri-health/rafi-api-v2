import { FastifyPluginAsync } from "fastify";

const bookingRouter: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post('/onsite', async (req) => {

  })

  fastify.post('/teletherapy', async (req) => {

  })
}

export default bookingRouter;
