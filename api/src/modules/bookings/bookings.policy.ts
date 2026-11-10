import type { Selectable } from "kysely";
import type { Courts } from "@db/db.generated.ts";
import { ConflictError, UnprocessableEntityError } from "@shared/errors.ts";

export type TimeRange = {
  startsAt: Date;
  endsAt: Date;
};

export type BookingSlot = TimeRange;

export type SlotStatus = "free" | "booked" | "past";

export type CourtSlot = TimeRange & {
  status: SlotStatus;
};

type CourtDay = {
  date: string;
  bookedSlots: BookingSlot[];
};

type StatusContext = Pick<CourtDay, "bookedSlots"> & Pick<SlotContext, "now">;

type BookingTimeRequest = {
  startsAt: Date;
  durationHours: number;
};

type CourtHours = Pick<Selectable<Courts>, "opensAt" | "closesAt">;

type SlotContext = {
  courtHours: CourtHours;
  now: Date;
};

type CancellableBooking = {
  startsAt: Date;
  cancelledAt: Date | null;
};

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const MIDNIGHT = "00:00:00";
const ISO_DATE_LENGTH = "2026-01-01".length;
const SLOT_MS = 1 * MS_PER_HOUR;
const CANCELLATION_CUTOFF_HOURS = 2;
const HOURS_MINUTES_LENGTH = "08:00".length;

const COURT_CLOCK_FORMAT = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Lisbon",
  dateStyle: "short",
  timeStyle: "medium",
});

export const ALREADY_CANCELLED_MESSAGE = "This booking is already cancelled";

export function buildBookableSlot(
  { startsAt, durationHours }: BookingTimeRequest,
  { courtHours, now }: SlotContext,
): BookingSlot {
  const slot = {
    startsAt,
    endsAt: new Date(startsAt.getTime() + durationHours * MS_PER_HOUR),
  };

  if (startsAt <= now)
    throw new UnprocessableEntityError("A booking must start in the future");
  if (!checkIsOnWholeHour(startsAt))
    throw new UnprocessableEntityError("A booking must start on a whole hour");
  if (!checkIsWithinCourtHours(slot, courtHours)) {
    throw new UnprocessableEntityError(buildCourtHoursMessage(courtHours));
  }

  return slot;
}

export function listCourtDaySlots(
  { date, bookedSlots }: CourtDay,
  { courtHours, now }: SlotContext,
): CourtSlot[] {
  return listOpeningSlots(date, courtHours).map((slot) => ({
    ...slot,
    status: readSlotStatus(slot, { bookedSlots, now }),
  }));
}

export function buildOpenHoursRange(
  date: string,
  { opensAt, closesAt }: CourtHours,
): TimeRange {
  return {
    startsAt: buildCourtInstant(date, opensAt),
    endsAt: buildCourtInstant(date, closesAt),
  };
}

export function buildCourtDayRange(date: string): TimeRange {
  return {
    startsAt: buildCourtInstant(date, MIDNIGHT),
    endsAt: buildCourtInstant(readNextDate(date), MIDNIGHT),
  };
}

export function assertBookingCanBeCancelled(
  booking: CancellableBooking,
  now: Date,
) {
  if (booking.cancelledAt !== null)
    throw new ConflictError(ALREADY_CANCELLED_MESSAGE);

  const latestCancellationMs =
    booking.startsAt.getTime() - CANCELLATION_CUTOFF_HOURS * MS_PER_HOUR;

  if (now.getTime() > latestCancellationMs) {
    throw new ConflictError(
      `A booking can be cancelled only up to ${String(CANCELLATION_CUTOFF_HOURS)} hours before its start time`,
    );
  }
}

function listOpeningSlots(date: string, courtHours: CourtHours) {
  const opening = buildOpenHoursRange(date, courtHours);
  const openingMs = opening.startsAt.getTime();
  const closingMs = opening.endsAt.getTime();
  const slotCount = Math.floor((closingMs - openingMs) / SLOT_MS);

  return Array.from(Array(slotCount).keys(), (slotIndex) =>
    buildOpeningSlot(openingMs + slotIndex * SLOT_MS),
  );
}

function buildOpeningSlot(startsAtMs: number) {
  return {
    startsAt: new Date(startsAtMs),
    endsAt: new Date(startsAtMs + SLOT_MS),
  };
}

function readSlotStatus(
  slot: TimeRange,
  { bookedSlots, now }: StatusContext,
): SlotStatus {
  if (slot.startsAt <= now) return "past";
  if (checkIsBooked(slot, bookedSlots)) return "booked";

  return "free";
}

function checkIsBooked(slot: BookingSlot, bookedSlots: BookingSlot[]) {
  return bookedSlots.some(
    (bookedSlot) =>
      slot.startsAt < bookedSlot.endsAt && bookedSlot.startsAt < slot.endsAt,
  );
}

function readNextDate(date: string) {
  const nextDayAsUtc = new Date(new Date(`${date}T${MIDNIGHT}Z`).getTime() + MS_PER_DAY);

  return nextDayAsUtc.toISOString().slice(0, ISO_DATE_LENGTH);
}

function buildCourtInstant(date: string, time: string) {
  const clockAsUtc = new Date(`${date}T${time}Z`);
  const courtClock = readCourtClock(clockAsUtc);
  const courtClockAsUtc = new Date(`${courtClock.date}T${courtClock.time}Z`);
  const courtOffsetMs = courtClockAsUtc.getTime() - clockAsUtc.getTime();

  return new Date(clockAsUtc.getTime() - courtOffsetMs);
}

function checkIsOnWholeHour(instant: Date) {
  return (
    readCourtClock(instant).time.endsWith(":00:00") &&
    instant.getMilliseconds() === 0
  );
}

function checkIsWithinCourtHours(slot: BookingSlot, courtHours: CourtHours) {
  const start = readCourtClock(slot.startsAt);
  const end = readCourtClock(slot.endsAt);
  const isSameDay = start.date === end.date;

  return (
    isSameDay &&
    start.time >= courtHours.opensAt &&
    end.time <= courtHours.closesAt
  );
}

function buildCourtHoursMessage({ opensAt, closesAt }: CourtHours) {
  const opening = opensAt.slice(0, HOURS_MINUTES_LENGTH);
  const closing = closesAt.slice(0, HOURS_MINUTES_LENGTH);

  return `This court is open from ${opening} to ${closing} Lisbon time`;
}

function readCourtClock(instant: Date) {
  const [date = "", time = ""] = COURT_CLOCK_FORMAT.format(instant).split(" ");

  return { date, time };
}
