import twillio from "twilio";

export const client = twillio(
  process.env.TWILLIO_ACCOUNT_SID,
  process.env.TWILLIO_AUTH_TOKEN,
);

// @ts-ignore
export function sendVerificationCode(
  username: string,
  channel: "sms" | "email",
) {
  // TODO: use zod and env.config file to resolve this
  return client.verify.v2
    .services(process.env.TWILLIO_VERIFY_SERVICE_SID ?? "")
    .verifications.create({
      to: username,
      channel,
    })
    .then((data) => data);
}

// @ts-ignore
export function checkVerificationCode(username: string, code: string) {
  return client.verify.v2
    .services(process.env.TWILLIO_VERIFY_SERVICE_ID ?? "")
    .verificationChecks.create({
      to: username,
      code,
    })
    .then((data) => data);
}
