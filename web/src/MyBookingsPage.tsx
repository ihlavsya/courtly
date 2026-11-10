import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { PlayerBooking } from "./api/bookings.ts";
import { myBookingsQueryOptions } from "./api/bookings.ts";
import { BOOKING_STATUS_STYLES, readBookingStatus } from "./bookingStatus.ts";
import { CancelBookingButton } from "./CancelBookingButton.tsx";
import { formatBookingTime } from "./courtTime.ts";
import { formatPrice } from "./money.ts";
import { SPORT_EMOJIS } from "./sports.ts";
import { BADGE_CLASS_NAME, TABLE_CELL_CLASS_NAME } from "./styles.ts";

type BookingsSectionProps = {
  title: string;
  bookings: PlayerBooking[];
  emptyState: ReactNode;
  className?: string;
  canCancel?: boolean;
};

type BookingsTableProps = Pick<BookingsSectionProps, "bookings"> & {
  canCancel: boolean;
};

type BookingRowProps = Pick<BookingsTableProps, "canCancel"> & {
  booking: PlayerBooking;
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
            canCancel
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

function BookingsSection({ title, bookings, emptyState, className, canCancel = false }: BookingsSectionProps) {
  return (
    <section className={className}>
      <h2 className="mb-4 text-lg font-semibold text-slate-900">{title}</h2>
      {bookings.length === 0 ? (
        <p className="text-slate-500">{emptyState}</p>
      ) : (
        <BookingsTable bookings={bookings} canCancel={canCancel} />
      )}
    </section>
  );
}

function BookingsTable({ bookings, canCancel }: BookingsTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left">
        <thead className="border-b border-slate-200 text-sm text-slate-500">
          <tr>
            <th className={`${TABLE_CELL_CLASS_NAME} font-medium`}>When</th>
            <th className={`${TABLE_CELL_CLASS_NAME} font-medium`}>Court</th>
            <th className={`${TABLE_CELL_CLASS_NAME} font-medium`}>Price</th>
            <th className={`${TABLE_CELL_CLASS_NAME} font-medium`}>Status</th>
            {canCancel && (
              <th className={TABLE_CELL_CLASS_NAME}>
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {bookings.map((booking) => (
            <BookingRow key={booking.id} booking={booking} canCancel={canCancel} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BookingRow({ booking, canCancel }: BookingRowProps) {
  const status = readBookingStatus(booking);
  const statusStyle = BOOKING_STATUS_STYLES[status];

  return (
    <tr className={statusStyle.rowClassName}>
      <td className={`${TABLE_CELL_CLASS_NAME} whitespace-nowrap`}>{formatBookingTime(booking)}</td>
      <td className={TABLE_CELL_CLASS_NAME}>
        <span role="img" aria-label={booking.sportType} className="mr-2">
          {SPORT_EMOJIS[booking.sportType]}
        </span>
        {booking.courtName}
      </td>
      <td className={TABLE_CELL_CLASS_NAME}>{formatPrice(booking.priceCents)}</td>
      <td className={TABLE_CELL_CLASS_NAME}>
        <span className={`${BADGE_CLASS_NAME} ${statusStyle.badgeClassName}`}>
          {statusStyle.label}
        </span>
      </td>
      {canCancel && (
        <td className={`${TABLE_CELL_CLASS_NAME} text-right`}>
          {status === "booked" && <CancelBookingButton bookingId={booking.id} />}
        </td>
      )}
    </tr>
  );
}
