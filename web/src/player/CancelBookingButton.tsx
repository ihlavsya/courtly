import { useEffect, useRef } from "react";
import { useCancelBooking } from "../api/bookings.ts";
import { readErrorMessage } from "../api/client.ts";

type CancelErrorDialogProps = {
  message: string | undefined;
  onClose: () => void;
};

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const cancelBooking = useCancelBooking();
  const errorMessage = cancelBooking.isError ? readErrorMessage(cancelBooking.error) : undefined;

  return (
    <>
      <button
        type="button"
        disabled={cancelBooking.isPending}
        onClick={() => {
          cancelBooking.mutate(bookingId);
        }}
        className="rounded-md border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {cancelBooking.isPending ? "Cancelling..." : "Cancel"}
      </button>
      <CancelErrorDialog message={errorMessage} onClose={cancelBooking.reset} />
    </>
  );
}

function CancelErrorDialog({ message, onClose }: CancelErrorDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (message !== undefined) dialogRef.current?.showModal();
  }, [message]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="m-auto w-full max-w-sm rounded-xl p-6 text-slate-900 shadow-xl backdrop:bg-slate-900/40"
    >
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-semibold">Could not cancel booking</h2>
        <p role="alert">{message}</p>
      </div>
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
