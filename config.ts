import { envSchema } from 'env-schema'
import { Type, Static } from '@sinclair/typebox'

const schema = Type.Object({
  DATABASE_URL: Type.String(),
  TWILIO_ACCOUNT_SID: Type.String(),
  TWILIO_VERIFY_SERVICE_SID: Type.String(),
  // SERVER_URL: Type.String(),
})

export type ConfigSchema = Static<typeof schema>

const config = envSchema<ConfigSchema>({
  schema
})

export default config
