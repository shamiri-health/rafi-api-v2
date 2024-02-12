import twillioClient from "./sms";

export function sendVerificationCode(
  username: string,
  channel: "sms" | "email",
) {
  // TODO: use zod and env.config file to resolve this
  return twillioClient.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID ?? "")
    .verifications.create({
      to: username,
      channel,
    })
    .then((data) => data);
}

// @ts-ignore
export function checkVerificationCode(username: string, code: string) {
  return twillioClient.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID ?? "")
    .verificationChecks.create({
      to: username,
      code,
    })
    .then((data) => data);
}
