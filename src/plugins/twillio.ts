// TODO: should be stubbed by sinon when testin
import twillio from "twilio";

const client = twillio(
  process.env.TWILLIO_ACCOUNT_SID,
  process.env.TWILLIO_AUTH_TOKEN,
  { autoRetry: true, maxRetries: 10 },
);
