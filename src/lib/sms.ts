import twilio from "twilio";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
  { autoRetry: true, maxRetries: 10 },
);

export default twilioClient;
