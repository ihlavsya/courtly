import { buildDayReport } from "@modules/bookings/bookings.day-report.ts";
import {
  ALREADY_CANCELLED_MESSAGE,
  assertBookingCanBeCancelled,
  buildBookableSlot,
  buildCourtDayRange,
  buildOpenHoursRange,
  listCourtDaySlots,
} from "@modules/bookings/bookings.policy.ts";
import {
  findBookingOfUser,
  insertBooking,
  listBookedSlotsOfCourt,
  listBookingsInRange,
  listBookingsOfUser,
  markBookingCancelled,
} from "@modules/bookings/bookings.repository.ts";
import type {
  AvailabilityQuery,
  CreateBookingRequest,
} from "@modules/bookings/bookings.schema.ts";
import { findActiveCourt, listCourts } from "@modules/courts/index.ts";
import { ConflictError, NotFoundError } from "@shared/errors.ts";

export async function createBooking(
  userId: string,
  bookingRequest: CreateBookingRequest,
) {
  const court = await findActiveCourt(bookingRequest.courtId);

  if (court === undefined) throw new NotFoundError("active court not found");

  const slot = buildBookableSlot(bookingRequest, {
    courtHours: court,
    now: new Date(),
  });
  const priceCents = court.hourlyPriceCents * bookingRequest.durationHours;
  const booking = await insertBooking({
    userId,
    courtId: court.id,
    slot,
    priceCents,
  });

  if (booking === undefined)
    throw new ConflictError("This court is already booked for that time");

  return booking;
}

export async function cancelBooking(userId: string, bookingId: string) {
  const booking = await findBookingOfUser(userId, bookingId);

  if (booking === undefined) throw new NotFoundError("Booking not found");

  const now = new Date();
  assertBookingCanBeCancelled(booking, now);

  const cancelledBooking = await markBookingCancelled(bookingId, now);

  if (cancelledBooking === undefined)
    throw new ConflictError(ALREADY_CANCELLED_MESSAGE);

  return cancelledBooking;
}

export async function listMyBookings(userId: string) {
  const bookings = await listBookingsOfUser(userId);

  return splitBookingsByTime(bookings, new Date());
}

export async function listSlotsOfCourt({
  courtId,
  date,
}: AvailabilityQuery) {
  const court = await findActiveCourt(courtId);

  if (court === undefined) throw new NotFoundError("active court not found");

  const bookedSlots = await listBookedSlotsOfCourt(
    court.id,
    buildOpenHoursRange(date, court),
  );

  return listCourtDaySlots(
    { date, bookedSlots },
    { courtHours: court, now: new Date() },
  );
}

export async function getDayReport(date: string) {
  const [courts, bookings] = await Promise.all([
    listCourts(),
    listBookingsInRange(buildCourtDayRange(date)),
  ]);

  return { date, ...buildDayReport({ courts, bookings }) };
}

function splitBookingsByTime<SortedBooking extends { endsAt: Date }>(
  bookings: SortedBooking[],
  now: Date,
) {
  return {
    upcoming: bookings.filter((booking) => booking.endsAt > now),
    past: bookings.filter((booking) => booking.endsAt <= now).toReversed(),
  };
}
