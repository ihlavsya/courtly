import type { TimeRange } from "./api/bookings.ts";
import type { SportType } from "./api/courts.ts";

export type BookingDay = {
  date: string;
  label: string;
};

const COURT_TIME_ZONE = "Europe/Lisbon";
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const CENTS_PER_EURO = 100;
const EURO_DECIMAL_PLACES = 2;
const ISO_DATE_LENGTH = "2026-01-01".length;

const COURT_DATE_FORMAT = new Intl.DateTimeFormat("sv-SE", { timeZone: COURT_TIME_ZONE, dateStyle: "short" });
const DAY_CHIP_FORMAT = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric" });
const COURT_HOUR_FORMAT = new Intl.DateTimeFormat("en-GB", {
  timeZone: COURT_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});
const BOOKING_DAY_FORMAT = new Intl.DateTimeFormat("en-GB", {
  timeZone: COURT_TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
});
const PRICE_FORMAT = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  trailingZeroDisplay: "stripIfInteger",
});

export const SPORT_EMOJIS: Record<SportType, string> = {
  tennis: "🎾",
  padel: "🏓",
  squash: "🥎",
  badminton: "🏸",
  pickleball: "🥒",
};

export const SPORT_LABELS: Record<SportType, string> = {
  tennis: "Tennis",
  padel: "Padel",
  squash: "Squash",
  badminton: "Badminton",
  pickleball: "Pickleball",
};

export const SPORT_TYPES = Object.keys(SPORT_LABELS) as SportType[];

export function listBookingDays(now: Date, dayCount: number): BookingDay[] {
  const todayAsUtcMs = new Date(`${readCourtDate(now)}T00:00:00Z`).getTime();

  return Array.from(Array(dayCount).keys(), (dayIndex) =>
    buildBookingDay(new Date(todayAsUtcMs + dayIndex * MS_PER_DAY), dayIndex),
  );
}

export function shiftDate(date: string, dayCount: number) {
  const shiftedDayAsUtc = new Date(new Date(`${date}T00:00:00Z`).getTime() + dayCount * MS_PER_DAY);

  return shiftedDayAsUtc.toISOString().slice(0, ISO_DATE_LENGTH);
}

export function readCourtDate(instant: Date) {
  return COURT_DATE_FORMAT.format(instant);
}

export function formatCourtHour(instant: string) {
  return COURT_HOUR_FORMAT.format(new Date(instant));
}

export function formatHourRange({ startsAt, endsAt }: TimeRange) {
  return `${formatCourtHour(startsAt)}–${formatCourtHour(endsAt)}`;
}

export function formatBookingTime(timeRange: TimeRange) {
  return `${BOOKING_DAY_FORMAT.format(new Date(timeRange.startsAt))}, ${formatHourRange(timeRange)}`;
}

export function formatPrice(cents: number) {
  return PRICE_FORMAT.format(cents / CENTS_PER_EURO);
}

export function formatEurosInput(cents: number) {
  return (cents / CENTS_PER_EURO).toFixed(EURO_DECIMAL_PLACES);
}

export function parseEurosToCents(eurosInput: string) {
  return Math.round(Number(eurosInput) * CENTS_PER_EURO);
}

function buildBookingDay(dayAsUtc: Date, dayIndex: number): BookingDay {
  return {
    date: dayAsUtc.toISOString().slice(0, ISO_DATE_LENGTH),
    label: dayIndex === 0 ? "Today" : DAY_CHIP_FORMAT.format(dayAsUtc),
  };
}
