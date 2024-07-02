import { google } from "googleapis";

export async function checkLegacyTherapistAvailability(
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

  console.log(JSON.stringify(res, null, 2));

  const availability: { email: string; available: boolean; errors?: any }[] =
    [];
  for (let i = 0; i < therapistEmails.length; i++) {
    const calendar = res?.data?.calendars?.[therapistEmails[i]];

    if (calendar?.errors) {
      availability.push({
        email: therapistEmails[i],
        errors: calendar?.errors,
        available: false,
      });
    } else if (calendar?.busy?.length) {
      availability.push({ email: therapistEmails[i], available: false });
    } else {
      availability.push({ email: therapistEmails[i], available: true });
    }
  }

  return availability;
}

export default async function checkTherapistAvailability(
  therapistEmails: string[],
  startTime: Date,
  endTime: Date,
  calendlyURL: string,
) {
  const TOKEN =
    "eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiUEFUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzE2Mjc1OTQ1LCJqdGkiOiJjNGUwNmE3Mi1hNGI5LTRiYWQtYTYwOS03ZmUyY2QwNzQxYTYiLCJ1c2VyX3V1aWQiOiI4N2Q1M2Q3ZC0zYjRkLTQyNjUtYTA3Yy05YmFlYjQ2MTc0ZDkifQ.kQVBq2gfoeYiRUYE8MJ1sjrUz_CyoEqBvK9m9OTV4-KYypBvwrmpGtxz-mfK_Y0n7MwWPZ0_t5w_q9e5Ie4lJQ";

  const API = "https://api.calendly.com";

  const params = new URLSearchParams({
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    user: calendlyURL, //'https://api.calendly.com/users/0fade096-1c36-425e-a94d-d6250302e925'
  });

  const response = await fetch(`${API}/user_busy_times?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  });

  return await response.json();
}
