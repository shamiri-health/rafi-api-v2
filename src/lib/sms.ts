import twilio from "twilio";
import envConfig from '../config'

const twilioClient = twilio(
  envConfig.TWILIO_ACCOUNT_SID,
  envConfig.TWILIO_AUTH_TOKEN,
  { autoRetry: true, maxRetries: 10 },
);

export default twilioClient;
