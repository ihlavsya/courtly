import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { CourtDayReport, DayBooking } from "./api/bookings.ts";
import { buildDayReportQueryOptions } from "./api/bookings.ts";
import { formatHourRange, formatPrice, readCourtDate, shiftDate, SPORT_EMOJIS } from "./courtDisplay.ts";

type BookingStatus = "booked" | "cancelled";

type BookingStatusStyle = {
  label: string;
  badgeClassName: string;
  rowClassName: string;
};

type DayPickerProps = {
  date: string;
  onChange: (date: string) => void;
};

const CELL_CLASS_NAME = "px-4 py-3";
const DAY_BUTTON_CLASS_NAME = "rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100";
const BADGE_CLASS_NAME = "rounded-full px-2 py-0.5 text-xs font-medium";

const BOOKING_STATUS_STYLES: Record<BookingStatus, BookingStatusStyle> = {
  booked: { label: "Booked", badgeClassName: "bg-emerald-100 text-emerald-800", rowClassName: "" },
  cancelled: { label: "Cancelled", badgeClassName: "bg-slate-100 text-slate-500", rowClassName: "text-slate-400" },
};

export function DayReportPage() {
  const [date, setDate] = useState(() => readCourtDate(new Date()));
  const dayReportQuery = useQuery(buildDayReportQueryOptions(date));

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Bookings</h1>
        <DayPicker date={date} onChange={setDate} />
      </div>
      {dayReportQuery.isPending && <p className="text-slate-500">Loading bookings...</p>}
      {dayReportQuery.isError && (
        <p role="alert" className="text-red-600">
          Could not load bookings. Try again.
        </p>
      )}
      {dayReportQuery.isSuccess && (
        <>
          <p className="text-lg">
            Expected revenue:{" "}
            <span className="font-semibold text-emerald-700">
              {formatPrice(dayReportQuery.data.totalExpectedRevenueCents)}
            </span>
          </p>
          {dayReportQuery.data.courts.map((courtReport) => (
            <CourtReportSection key={courtReport.court.id} courtReport={courtReport} />
          ))}
        </>
      )}
    </section>
  );
}

function DayPicker({ date, onChange }: DayPickerProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Previous day"
        className={DAY_BUTTON_CLASS_NAME}
        onClick={() => {
          onChange(shiftDate(date, -1));
        }}
      >
        ◀
      </button>
      <input
        type="date"
        aria-label="Day"
        required
        value={date}
        className="rounded-md border border-slate-300 bg-white px-3 py-1 focus:outline-2 focus:outline-emerald-600"
        onChange={(event) => {
          if (event.target.value !== "") onChange(event.target.value);
        }}
      />
      <button
        type="button"
        aria-label="Next day"
        className={DAY_BUTTON_CLASS_NAME}
        onClick={() => {
          onChange(shiftDate(date, 1));
        }}
      >
        ▶
      </button>
    </div>
  );
}

function CourtReportSection({ courtReport: { court, expectedRevenueCents, bookings } }: { courtReport: CourtDayReport }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
        <span role="img" aria-label={court.sportType}>
          {SPORT_EMOJIS[court.sportType]}
        </span>
        <h2 className="font-semibold">{court.name}</h2>
        {court.status === "deactivated" && (
          <span className={`${BADGE_CLASS_NAME} bg-amber-100 text-amber-800`}>Deactivated</span>
        )}
        <span className="ml-auto font-semibold">{formatPrice(expectedRevenueCents)}</span>
      </header>
      {bookings.length === 0 ? (
        <p className={`${CELL_CLASS_NAME} text-slate-500`}>No bookings</p>
      ) : (
        <table className="w-full text-left">
          <tbody className="divide-y divide-slate-100">
            {bookings.map((booking) => (
              <DayBookingRow key={booking.id} booking={booking} />
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function DayBookingRow({ booking }: { booking: DayBooking }) {
  const statusStyle = BOOKING_STATUS_STYLES[readBookingStatus(booking)];

  return (
    <tr className={statusStyle.rowClassName}>
      <td className={`${CELL_CLASS_NAME} whitespace-nowrap`}>{formatHourRange(booking)}</td>
      <td className={CELL_CLASS_NAME}>{booking.playerEmail}</td>
      <td className={CELL_CLASS_NAME}>{formatPrice(booking.priceCents)}</td>
      <td className={`${CELL_CLASS_NAME} text-right`}>
        <span className={`${BADGE_CLASS_NAME} ${statusStyle.badgeClassName}`}>{statusStyle.label}</span>
      </td>
    </tr>
  );
}

function readBookingStatus(booking: DayBooking): BookingStatus {
  return booking.cancelledAt === undefined ? "booked" : "cancelled";
}
