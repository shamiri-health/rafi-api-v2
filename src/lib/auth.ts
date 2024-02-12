import twillioClient from "./sms";
import envConfig from '../config'

export function sendVerificationCode(
  username: string,
  channel: "sms" | "email",
) {
  return twillioClient.verify.v2
    .services(envConfig.TWILIO_VERIFY_SERVICE_SID ?? "")
    .verifications.create({
      to: username,
      channel,
    })
    .then((data) => data);
}

// @ts-ignore
export function checkVerificationCode(username: string, code: string) {
  return twillioClient.verify.v2
    .services(envConfig.TWILIO_VERIFY_SERVICE_SID ?? "")
    .verificationChecks.create({
      to: username,
      code,
    })
    .then((data) => data);
}
