import { format } from "date-fns/format";

const SAFARICOM_URL =
  process.env.APP_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

export async function fetchMpesaAccessToken() {
  // base64 string of CONSUMER_KEY + : + CONSUMER_SECRET
  const tokenAuth = btoa(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`,
  );

  const accessTokenResponse = await fetch(
    `${SAFARICOM_URL}/oauth/v1/generate?grant_type=client_credentials`,
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

export async function triggerMpesaPush(
  accessToken: string,
  price: number,
  phoneNumber: string,
  accountReference: string,
) {
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
    PartyA: phoneNumber,
    PartyB: process.env.MPESA_SHORTCODE,
    PhoneNumber: phoneNumber,
    CallBackURL: `${process.env.SERVER_URL}/subscriptions/v2/payments/mpesa-callback`,
    AccountReference: accountReference,
    TransactionDesc: "Subscription Payment",
  });

  const res = await fetch(`${SAFARICOM_URL}/mpesa/stkpush/v1/processrequest`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    method: "POST",
    body,
  });

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
