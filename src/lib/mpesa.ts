import { format } from "date-fns/format";

export async function fetchMpesaAccessToken() {
  // base64 string of CONSUMER_KEY + : + CONSUMER_SECRET
  const tokenAuth = btoa(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`,
  );

  const accessTokenResponse = await fetch(
    "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${tokenAuth}`,
      },
      method: "GET",
    },
  );

  if (!accessTokenResponse.ok) {
    throw new Error("sorry could not fetch the safaricom MPESA token");
  }

  const accessTokenBody: { access_token: string; expires_in: string } =
    await accessTokenResponse.json();

  return accessTokenBody.access_token;
}

// TODO: add partyA/phoneNumber arg to this
export async function triggerMpesaPush(accessToken: string, price: number) {
  const timestamp = format(new Date(), "yyyyMMddHHmmss");

  // A base64 encoded string. (The base64 string is a combination of Shortcode+Passkey+Timestamp)
  const password = btoa(
    `${process.env.MPESA_SHORTCODE}${process.env.DARAJA_PASSKEY}${timestamp}`,
  );

  const body = JSON.stringify({
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: price,
    PartyA: "254717266218",
    PartyB: process.env.MPESA_SHORTCODE,
    PhoneNumber: "254717266218",
    // TODO: ensure that callback url is from server url
    CallBackURL:
      "https://swedish-vocabulary-reasoning-receives.trycloudflare.com/subscriptions/v2/payments/mpesa-callback",
    // TODO: ensure that account reference is changed
    AccountReference: "Test",
    TransactionDesc: "Test",
  });

  const res = await fetch(
    "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      method: "POST",
      body,
    },
  );

  if (!res.ok) {
    throw new Error("Could not process MPESA payment request at this time");
  }

  type MpesaResponse = {
    MerchantRequestID: string;
    CheckoutRequestID: string;
    ResponseCode: string;
    ResponseDescription: string;
    CustomerMessage: string;
  };

  const mpesaBody: MpesaResponse = await res.json();

  if (mpesaBody.ResponseCode !== "0") {
    // the transaction cannot be initiated or there was an error
    // see: https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate

    throw new Error(mpesaBody.ResponseDescription);
  }

  return mpesaBody;
}
