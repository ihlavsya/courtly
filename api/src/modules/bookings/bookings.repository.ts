import { sql } from "kysely";
import type { BookingSlot, TimeRange } from "@modules/bookings/bookings.policy.ts";
import { db } from "@shared/db.ts";

type NewBooking = {
  userId: string;
  courtId: number;
  slot: BookingSlot;
  priceCents: number;
};

const BOOKING_COLUMNS = [
  "bookings.id",
  "bookings.courtId",
  "bookings.priceCents",
  "bookings.cancelledAt",
  sql<Date>`lower(bookings.time_slot)`.as("startsAt"),
  sql<Date>`upper(bookings.time_slot)`.as("endsAt"),
] as const;

export function insertBooking({ slot, ...booking }: NewBooking) {
  return db
    .insertInto("bookings")
    .values({ ...booking, timeSlot: sql<string>`tstzrange(${slot.startsAt}, ${slot.endsAt}, '[)')` })
    .onConflict((conflict) => conflict.constraint("bookings_no_court_overlap").doNothing())
    .returning(BOOKING_COLUMNS)
    .executeTakeFirst();
}

export function findBookingOfUser(userId: string, bookingId: string) {
  return db
    .selectFrom("bookings")
    .select(BOOKING_COLUMNS)
    .where("bookings.id", "=", bookingId)
    .where("bookings.userId", "=", userId)
    .executeTakeFirst();
}

export function markBookingCancelled(bookingId: string, cancelledAt: Date) {
  return db
    .updateTable("bookings")
    .set({ cancelledAt })
    .where("bookings.id", "=", bookingId)
    .where("bookings.cancelledAt", "is", null)
    .returning(BOOKING_COLUMNS)
    .executeTakeFirst();
}

export function listBookedSlotsOfCourt(courtId: number, openHours: TimeRange): Promise<BookingSlot[]> {
  return db
    .selectFrom("bookings")
    .select([sql<Date>`lower(bookings.time_slot)`.as("startsAt"), sql<Date>`upper(bookings.time_slot)`.as("endsAt")])
    .where("bookings.courtId", "=", courtId)
    .where("bookings.cancelledAt", "is", null)
    .where(sql<boolean>`bookings.time_slot && tstzrange(${openHours.startsAt}, ${openHours.endsAt}, '[)')`)
    .execute();
}

export function listBookingsOfUser(userId: string) {
  return db
    .selectFrom("bookings")
    .innerJoin("courts", "courts.id", "bookings.courtId")
    .select([...BOOKING_COLUMNS, "courts.name as courtName", "courts.sportType"])
    .where("bookings.userId", "=", userId)
    .orderBy("startsAt")
    .execute();
}
