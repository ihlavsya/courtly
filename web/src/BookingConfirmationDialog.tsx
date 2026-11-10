import { useEffect, useRef } from "react";
import type { Booking } from "./api/bookings.ts";
import type { Court } from "./api/courts.ts";
import { formatBookingTime } from "./courtTime.ts";
import { formatPrice } from "./money.ts";
import { SPORT_EMOJIS } from "./sports.ts";

type BookingConfirmationDialogProps = {
  court: Court;
  booking: Booking | undefined;
  onClose: () => void;
};

export function BookingConfirmationDialog({ court, booking, onClose }: BookingConfirmationDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (booking !== undefined) dialogRef.current?.showModal();
  }, [booking]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="m-auto w-full max-w-sm rounded-xl p-6 text-slate-900 shadow-xl backdrop:bg-slate-900/40"
    >
      {booking !== undefined && (
        <div className="space-y-2 text-center">
          <p aria-hidden="true" className="text-4xl">
            ✅
          </p>
          <h2 className="text-xl font-semibold">Court booked</h2>
          <p>
            {SPORT_EMOJIS[court.sportType]} {court.name}
          </p>
          <p>{formatBookingTime(booking)}</p>
          <p className="font-medium">{formatPrice(booking.priceCents)}</p>
          <p className="text-sm text-slate-500">These hours now show as booked.</p>
        </div>
      )}
      <form method="dialog" className="mt-6">
        <button
          type="submit"
          autoFocus
          className="w-full rounded-md bg-emerald-700 px-3 py-2 font-medium text-white hover:bg-emerald-800"
        >
          Got it
        </button>
      </form>
    </dialog>
  );
}
