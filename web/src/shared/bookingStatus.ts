import type { DayBooking, PlayerBooking } from "../api/bookings.ts";

type BookingStatus = "booked" | "cancelled";

type BookingStatusStyle = {
  label: string;
  badgeClassName: string;
  rowClassName: string;
};

export const BOOKING_STATUS_STYLES: Record<BookingStatus, BookingStatusStyle> = {
  booked: { label: "Booked", badgeClassName: "bg-emerald-100 text-emerald-800", rowClassName: "" },
  cancelled: { label: "Cancelled", badgeClassName: "bg-slate-100 text-slate-500", rowClassName: "text-slate-400" },
};

export function readBookingStatus(booking: PlayerBooking | DayBooking): BookingStatus {
  return booking.cancelledAt === undefined ? "booked" : "cancelled";
}
