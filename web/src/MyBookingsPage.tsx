import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { PlayerBooking } from "./api/bookings.ts";
import { myBookingsQueryOptions } from "./api/bookings.ts";
import { formatBookingTime, formatPrice, SPORT_EMOJIS } from "./courtDisplay.ts";

type BookingStatus = "booked" | "cancelled";

type BookingStatusStyle = {
  label: string;
  badgeClassName: string;
  rowClassName: string;
};

type BookingsSectionProps = {
  title: string;
  bookings: PlayerBooking[];
  emptyState: ReactNode;
  className?: string;
};

const CELL_CLASS_NAME = "px-4 py-3";

const BOOKING_STATUS_STYLES: Record<BookingStatus, BookingStatusStyle> = {
  booked: { label: "Booked", badgeClassName: "bg-emerald-100 text-emerald-800", rowClassName: "" },
  cancelled: { label: "Cancelled", badgeClassName: "bg-slate-100 text-slate-500", rowClassName: "text-slate-400" },
};

export function MyBookingsPage() {
  const bookingsQuery = useQuery(myBookingsQueryOptions);

  return (
    <section className="space-y-8">
      <h1 className="text-2xl font-semibold">My bookings</h1>
      {bookingsQuery.isPending && <p className="text-slate-500">Loading bookings...</p>}
      {bookingsQuery.isError && (
        <p role="alert" className="text-red-600">
          Could not load bookings. Try again.
        </p>
      )}
      {bookingsQuery.isSuccess && (
        <>
          <BookingsSection
            title="Upcoming"
            bookings={bookingsQuery.data.upcoming}
            emptyState={<NoUpcomingBookings />}
          />
          <BookingsSection
            title="Past"
            bookings={bookingsQuery.data.past}
            emptyState="No past bookings yet."
            className="text-slate-500"
          />
        </>
      )}
    </section>
  );
}

function NoUpcomingBookings() {
  return (
    <>
      No upcoming bookings.{" "}
      <Link to="/bookings/new" className="font-medium text-emerald-700 hover:text-emerald-800">
        Book a court
      </Link>
    </>
  );
}

function BookingsSection({ title, bookings, emptyState, className }: BookingsSectionProps) {
  return (
    <section className={className}>
      <h2 className="mb-4 text-lg font-semibold text-slate-900">{title}</h2>
      {bookings.length === 0 ? <p className="text-slate-500">{emptyState}</p> : <BookingsTable bookings={bookings} />}
    </section>
  );
}

function BookingsTable({ bookings }: { bookings: PlayerBooking[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left">
        <thead className="border-b border-slate-200 text-sm text-slate-500">
          <tr>
            <th className={`${CELL_CLASS_NAME} font-medium`}>When</th>
            <th className={`${CELL_CLASS_NAME} font-medium`}>Court</th>
            <th className={`${CELL_CLASS_NAME} font-medium`}>Price</th>
            <th className={`${CELL_CLASS_NAME} font-medium`}>Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {bookings.map((booking) => (
            <BookingRow key={booking.id} booking={booking} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BookingRow({ booking }: { booking: PlayerBooking }) {
  const statusStyle = BOOKING_STATUS_STYLES[readBookingStatus(booking)];

  return (
    <tr className={statusStyle.rowClassName}>
      <td className={`${CELL_CLASS_NAME} whitespace-nowrap`}>{formatBookingTime(booking)}</td>
      <td className={CELL_CLASS_NAME}>
        <span role="img" aria-label={booking.sportType} className="mr-2">
          {SPORT_EMOJIS[booking.sportType]}
        </span>
        {booking.courtName}
      </td>
      <td className={CELL_CLASS_NAME}>{formatPrice(booking.priceCents)}</td>
      <td className={CELL_CLASS_NAME}>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle.badgeClassName}`}>
          {statusStyle.label}
        </span>
      </td>
    </tr>
  );
}

function readBookingStatus(booking: PlayerBooking): BookingStatus {
  return booking.cancelledAt === undefined ? "booked" : "cancelled";
}
