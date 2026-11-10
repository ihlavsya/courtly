import {
  ALREADY_CANCELLED_MESSAGE,
  assertBookingCanBeCancelled,
  buildBookableSlot,
} from "@modules/bookings/bookings.policy.ts";
import {
  findActiveCourt,
  findBookingOfUser,
  insertBooking,
  listBookingsOfUser,
  markBookingCancelled,
} from "@modules/bookings/bookings.repository.ts";
import type { CreateBookingRequest } from "@modules/bookings/bookings.schema.ts";
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

function splitBookingsByTime<SortedBooking extends { endsAt: Date }>(
  bookings: SortedBooking[],
  now: Date,
) {
  return {
    upcoming: bookings.filter((booking) => booking.endsAt > now),
    past: bookings.filter((booking) => booking.endsAt <= now).toReversed(),
  };
}
