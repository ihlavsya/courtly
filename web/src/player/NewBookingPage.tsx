import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { Court } from "../api/courts.ts";
import { activeCourtsQueryOptions } from "../api/courts.ts";
import { CourtSlotPicker } from "./CourtSlotPicker.tsx";
import { formatPrice } from "../shared/money.ts";
import { SPORT_EMOJIS } from "../shared/sports.ts";

type CourtTileProps = {
  court: Court;
  isSelected: boolean;
  onSelect: (courtId: number) => void;
};

export function NewBookingPage() {
  const courtsQuery = useQuery(activeCourtsQueryOptions);
  const [selectedCourtId, setSelectedCourtId] = useState<number>();
  const selectedCourt = courtsQuery.data?.find((court) => court.id === selectedCourtId);

  return (
    <section className="space-y-10">
      <div>
        <h1 className="mb-6 text-2xl font-semibold">Choose a court</h1>
        {courtsQuery.isPending && <p className="text-slate-500">Loading courts...</p>}
        {courtsQuery.isError && (
          <p role="alert" className="text-red-600">
            Could not load courts. Try again.
          </p>
        )}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {courtsQuery.data?.map((court) => (
            <CourtTile
              key={court.id}
              court={court}
              isSelected={court.id === selectedCourtId}
              onSelect={setSelectedCourtId}
            />
          ))}
        </div>
      </div>
      {selectedCourt !== undefined && <CourtSlotPicker key={selectedCourt.id} court={selectedCourt} />}
    </section>
  );
}

function CourtTile({ court, isSelected, onSelect }: CourtTileProps) {
  const selectionClassName = isSelected ? "bg-emerald-800 ring-4 ring-emerald-300" : "bg-emerald-700";

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={() => {
        onSelect(court.id);
      }}
      className={`flex aspect-4/3 flex-col justify-between rounded-xl p-4 text-left text-white hover:bg-emerald-800 ${selectionClassName}`}
    >
      <span aria-hidden="true" className="text-4xl">
        {SPORT_EMOJIS[court.sportType]}
      </span>
      <span>
        <span className="block text-lg font-medium">{court.name}</span>
        <span className="text-sm text-emerald-100">{formatPrice(court.hourlyPriceCents)} / hour</span>
      </span>
    </button>
  );
}
