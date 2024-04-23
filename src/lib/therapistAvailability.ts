import { Static, Type } from "@sinclair/typebox";
import { parse, differenceInMilliseconds, addHours } from "date-fns";

const Availability = Type.Object({
  available: Type.Boolean(),
  startDatetime: Type.Date(),
  endDatetime: Type.Date(),
});

type Availability = Static<typeof Availability>;

interface GoogleResponse {
  timeMin: string;
  timeMax: string;
  calendars: {
    [key: string]: {
      busy: {
        start: string;
        end: string;
      }[];
    };
  };
}

export const getAvailArrayGoogle = (
  googleResponse: GoogleResponse,
): Availability[] => {
  const timeMin = parse(
    googleResponse.timeMin,
    "yyyy-MM-dd HH:mm:ss",
    new Date(),
  );
  const timeMax = parse(
    googleResponse.timeMax,
    "yyyy-MM-dd HH:mm:ss",
    new Date(),
  );
  const totalSlots = Math.floor(
    differenceInMilliseconds(timeMax, timeMin) / (3600 * 1000),
  );

  let slotsTaken: { start: string; end: string }[] = [];
  for (const slots of Object.values(googleResponse.calendars)) {
    slotsTaken = slotsTaken.concat(slots.busy);
  }

  slotsTaken.sort(
    (a, b) =>
      parse(a.start, "yyyy-MM-dd HH:mm:ss", new Date()).getTime() -
      parse(b.start, "yyyy-MM-dd HH:mm:ss", new Date()).getTime(),
  );

  const availArray: Availability[] = [];

  function findConflict(
    _min: Date,
    _max: Date,
    slotsTaken: { start: string; end: string }[],
  ): boolean {
    for (const s of slotsTaken) {
      if (
        parse(s.start, "yyyy-MM-dd HH:mm:ss", new Date()) < _max &&
        parse(s.end, "yyyy-MM-dd HH:mm:ss", new Date()) > _min
      ) {
        return true;
      }
    }
    return false;
  }

  function timePast(_min: Date): boolean {
    return _min.getTime() - new Date().getTime() < 300 * 1000;
  }

  for (let slot = 0; slot < totalSlots; slot++) {
    const _min = addHours(timeMin, slot);
    const _max = addHours(timeMin, slot + 1);
    availArray.push({
      startDatetime: _min,
      endDatetime: _max,
      available: !findConflict(_min, _max, slotsTaken) && !timePast(_min),
    });
  }

  return availArray;
};
