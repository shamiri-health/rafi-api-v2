import z from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string(),
  TWILIO_ACCOUNT_SID: z.string(),
  TWILIO_VERIFY_SERVICE_SID: z.string(),
  TWILIO_AUTH_TOKEN: z.string(),
  // SERVER_URL: z.string(),
})

const parsedConfig = envSchema.safeParse(process.env)

console.log('got here')
console.log(parsedConfig)
if (!parsedConfig.success) {
  console.error('Failed to parse environment for server')
  console.error(parsedConfig.error.issues)
  process.exit(1)
}


export default parsedConfig.data
