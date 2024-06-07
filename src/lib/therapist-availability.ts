import { google } from "googleapis";

export default async function checkTherapistAvailability(
  therapistEmails: string[],
  startTime: Date,
  endTime: Date,
) {
  // FIXME: ensure credentials can be uploaded to GitHub
  const auth = new google.auth.GoogleAuth({
    keyFile: "./credentials.json",
    scopes: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ],
  });

  // const client = auth.fromJSON(keys)

  google.options({
    auth,
  });

  const calendar = google.calendar("v3");

  const res = await calendar.freebusy.query({
    requestBody: {
      items: therapistEmails.map((email) => ({ id: email })),
      timeMax: endTime.toISOString(),
      timeMin: startTime.toISOString(),
      groupExpansionMax: 1,
      calendarExpansionMax: 10,
    },
  });

  return res.data.calendars;
}
