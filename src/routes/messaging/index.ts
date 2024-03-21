import admin from "firebase-admin";
import { FastifyPluginAsync } from "fastify";
import { Static, Type } from "@sinclair/typebox";
import serviceKey from "../../../static/shamiri-health-app-firebase-adminsdk-service-key.json";

const MessageBody = Type.Object({
    clientId: Type.String(),
    title: Type.String(),
    body: Type.String()
});

type MessageBody = Static <typeof MessageBody>;

const serviceAccount = serviceKey as admin.ServiceAccount
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

const messagingRouter: FastifyPluginAsync = async (fastify, _): Promise<void> => {
    fastify.post<{ Body: MessageBody }>("/", 
        {
            schema: {
                body: MessageBody
            }
        }, 
        async (request) => {
            const { clientId, title, body } = request.body;
            
            // the message structure
            const message = {
                data: {
                    title,
                    body,
                    clientId,
                },
                condition: "'rafiMessages' in topics", // do not change since this topic is hardcoded on the client app.
            }
            
            // try sending the message
            admin.messaging()
            .send(message)
            .catch(error => {
                fastify.log.error(error);
                throw error;
            })
        }
    )
}

export default messagingRouter;