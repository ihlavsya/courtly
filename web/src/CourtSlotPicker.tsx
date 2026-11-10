import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { Booking, CourtSlot, DurationHours, TimeRange } from "./api/bookings.ts";
import { buildCourtDaySlotsQueryOptions, useCreateBooking } from "./api/bookings.ts";
import { readErrorMessage } from "./api/client.ts";
import type { Court } from "./api/courts.ts";
import { BookingConfirmationDialog } from "./BookingConfirmationDialog.tsx";
import { formatCourtHour, formatHourRange, formatPrice, listBookingDays, readCourtDate } from "./courtDisplay.ts";

type BookingDraft = {
  date: string;
  durationHours: DurationHours;
  startsAt: string | undefined;
};

type SelectedRange = TimeRange & {
  firstIndex: number;
  lastIndex: number;
};

type HourChipState = "selected" | "available" | "tooShort" | "booked" | "past";

type HourChipProps = {
  slot: CourtSlot;
  state: HourChipState;
  durationHours: DurationHours;
  onPick: (startsAt: string) => void;
};

const BOOKING_DAY_COUNT = 7;
const DURATION_OPTIONS: DurationHours[] = [1, 2];
const CHIP_CLASS_NAME = "rounded-md border px-3 py-2 text-sm";
const TOGGLE_CLASS_NAME = "rounded-md border px-4 py-2 text-sm font-medium";
const ACTIVE_CLASS_NAME = "border-emerald-700 bg-emerald-700 text-white";
const INACTIVE_CLASS_NAME = "border-slate-300 bg-white text-slate-700 hover:border-emerald-700";

const HOUR_CHIP_CLASS_NAMES: Record<HourChipState, string> = {
  selected: ACTIVE_CLASS_NAME,
  available: INACTIVE_CLASS_NAME,
  tooShort: "border-dashed border-slate-300 bg-white text-slate-400",
  booked: "border-slate-200 bg-slate-200 text-slate-500",
  past: "border-slate-100 bg-slate-100 text-slate-300",
};

const HOUR_CHIP_NOTES: Record<HourChipState, string> = {
  selected: "selected",
  available: "free",
  tooShort: "free",
  booked: "booked",
  past: "past",
};

export function CourtSlotPicker({ court }: { court: Court }) {
  const [bookingDays] = useState(() => listBookingDays(new Date(), BOOKING_DAY_COUNT));
  const [draft, setDraft] = useState<BookingDraft>(() => ({
    date: readCourtDate(new Date()),
    durationHours: 1,
    startsAt: undefined,
  }));
  const [confirmedBooking, setConfirmedBooking] = useState<Booking>();
  const slotsQuery = useQuery(buildCourtDaySlotsQueryOptions(court.id, draft.date));
  const createBooking = useCreateBooking();
  const slots = slotsQuery.data ?? [];
  const selectedRange = findSelectedRange(slots, draft);

  function updateDraft(changes: Partial<BookingDraft>) {
    createBooking.reset();
    setDraft({ ...draft, ...changes });
  }

  function handleBook() {
    if (selectedRange === undefined) return;

    const newBooking = { courtId: court.id, startsAt: selectedRange.startsAt, durationHours: draft.durationHours };

    createBooking.mutate(newBooking, {
      onSuccess: (booking) => {
        setConfirmedBooking(booking);
        setDraft({ ...draft, startsAt: undefined });
      },
    });
  }

  return (
    <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-semibold">Pick a time at {court.name}</h2>
      <div className="flex flex-wrap gap-2">
        {bookingDays.map(({ date, label }) => (
          <button
            key={date}
            type="button"
            aria-pressed={date === draft.date}
            onClick={() => {
              updateDraft({ date, startsAt: undefined });
            }}
            className={`${TOGGLE_CLASS_NAME} ${date === draft.date ? ACTIVE_CLASS_NAME : INACTIVE_CLASS_NAME}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="mr-2 text-sm text-slate-500">Length</span>
        {DURATION_OPTIONS.map((durationHours) => (
          <button
            key={durationHours}
            type="button"
            aria-pressed={durationHours === draft.durationHours}
            onClick={() => {
              updateDraft({ durationHours });
            }}
            className={`${TOGGLE_CLASS_NAME} ${durationHours === draft.durationHours ? ACTIVE_CLASS_NAME : INACTIVE_CLASS_NAME}`}
          >
            {durationHours}h
          </button>
        ))}
      </div>
      {slotsQuery.isPending && <p className="text-slate-500">Loading hours...</p>}
      {slotsQuery.isError && (
        <p role="alert" className="text-red-600">
          Could not load hours. Try again.
        </p>
      )}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {slots.map((slot, slotIndex) => (
          <HourChip
            key={slot.startsAt}
            slot={slot}
            state={readHourChipState(slots, slotIndex, { durationHours: draft.durationHours, selectedRange })}
            durationHours={draft.durationHours}
            onPick={(startsAt) => {
              updateDraft({ startsAt });
            }}
          />
        ))}
      </div>
      {createBooking.isError && (
        <p role="alert" className="text-sm text-red-600">
          {readErrorMessage(createBooking.error)}
        </p>
      )}
      <button
        type="button"
        disabled={selectedRange === undefined || createBooking.isPending}
        onClick={handleBook}
        className="w-full rounded-md bg-emerald-700 px-3 py-3 font-medium text-white hover:bg-emerald-800 disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {buildBookButtonLabel(selectedRange, { court, isPending: createBooking.isPending, draft })}
      </button>
      <BookingConfirmationDialog
        court={court}
        booking={confirmedBooking}
        onClose={() => {
          setConfirmedBooking(undefined);
        }}
      />
    </section>
  );
}

function HourChip({ slot, state, durationHours, onPick }: HourChipProps) {
  return (
    <button
      type="button"
      disabled={state !== "available"}
      aria-pressed={state === "selected"}
      title={state === "tooShort" ? `Not enough free time for ${String(durationHours)}h` : undefined}
      onClick={() => {
        onPick(slot.startsAt);
      }}
      className={`${CHIP_CLASS_NAME} ${HOUR_CHIP_CLASS_NAMES[state]}`}
    >
      <span className="block font-medium">{formatCourtHour(slot.startsAt)}</span>
      <span className="block text-xs">{HOUR_CHIP_NOTES[state]}</span>
    </button>
  );
}

function findSelectedRange(slots: CourtSlot[], draft: BookingDraft): SelectedRange | undefined {
  const firstIndex = slots.findIndex((slot) => slot.startsAt === draft.startsAt);
  const lastIndex = firstIndex + draft.durationHours - 1;
  const firstSlot = slots[firstIndex];
  const lastSlot = slots[lastIndex];

  if (firstSlot === undefined || lastSlot === undefined) return undefined;
  if (!checkCanStartBooking(slots, firstIndex, draft.durationHours)) return undefined;

  return { firstIndex, lastIndex, startsAt: firstSlot.startsAt, endsAt: lastSlot.endsAt };
}

function readHourChipState(
  slots: CourtSlot[],
  slotIndex: number,
  { durationHours, selectedRange }: { durationHours: DurationHours; selectedRange: SelectedRange | undefined },
): HourChipState {
  const slot = slots[slotIndex];
  const isInSelectedRange =
    selectedRange !== undefined && slotIndex >= selectedRange.firstIndex && slotIndex <= selectedRange.lastIndex;

  if (isInSelectedRange) return "selected";
  if (slot === undefined || slot.status === "past") return "past";
  if (slot.status === "booked") return "booked";

  return checkCanStartBooking(slots, slotIndex, durationHours) ? "available" : "tooShort";
}

function checkCanStartBooking(slots: CourtSlot[], startIndex: number, durationHours: DurationHours) {
  const coveredSlots = slots.slice(startIndex, startIndex + durationHours);

  return coveredSlots.length === durationHours && coveredSlots.every((slot) => slot.status === "free");
}

function buildBookButtonLabel(
  selectedRange: SelectedRange | undefined,
  { court, isPending, draft }: { court: Court; isPending: boolean; draft: BookingDraft },
) {
  if (isPending) return "Booking...";
  if (selectedRange === undefined) return "Pick an hour";

  const totalPrice = formatPrice(court.hourlyPriceCents * draft.durationHours);

  return `Book ${formatHourRange(selectedRange)} · ${totalPrice}`;
}
