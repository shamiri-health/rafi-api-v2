import { asc } from "drizzle-orm";
import { FastifyPluginAsync } from "fastify";
import { groupTopic } from "../../database/schema";
import { Type, Static } from "@sinclair/typebox";

const GroupTopic = Type.Object({
    id: Type.Number(),
    name: Type.String(),
    about: Type.String(),
    summary: Type.String()
})

type GroupTopic = Static<typeof GroupTopic>;

const groupTopics: FastifyPluginAsync = async (fastify, _): Promise<void> => {
    fastify.get("/", 
        {
            schema: {
                response: {
                    200: Type.Array(GroupTopic)
                }
            }
        }, 
        async () => {
            const groupTopics = await fastify.db.query.groupTopic.findMany({
                orderBy: asc(groupTopic.id)
            })
            
            return groupTopics;
        }
    )
}
export default groupTopics;
