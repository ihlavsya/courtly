import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import type { SubmitEvent } from "react";
import { useState } from "react";
import { readErrorMessage } from "./api/client.ts";
import type { AdminCourt } from "./api/courts.ts";
import {
  buildAdminCourtQueryOptions,
  COURT_NAME_MAX_LENGTH,
  HOURLY_PRICE_MAX_EUROS,
  HOURLY_PRICE_MIN_EUROS,
  useEditCourtDetails,
} from "./api/courts.ts";
import { formatEurosInput, parseEurosToCents } from "./money.ts";
import { SPORT_EMOJIS, SPORT_LABELS } from "./sports.ts";
import { INPUT_CLASS_NAME } from "./styles.ts";

type CourtDetailsForm = {
  name: string;
  eurosPerHour: string;
};

export function EditCourtPage({ courtId }: { courtId: number }) {
  const courtQuery = useQuery(buildAdminCourtQueryOptions(courtId));

  return (
    <section className="max-w-md">
      <h1 className="mb-6 text-2xl font-semibold">Edit court</h1>
      {courtQuery.isPending && <p className="text-slate-500">Loading court...</p>}
      {courtQuery.isError && (
        <p role="alert" className="text-red-600">
          {readErrorMessage(courtQuery.error)}
        </p>
      )}
      {courtQuery.isSuccess && <CourtDetailsEditor court={courtQuery.data} />}
    </section>
  );
}

function CourtDetailsEditor({ court }: { court: AdminCourt }) {
  const editCourtDetails = useEditCourtDetails();
  const navigate = useNavigate();
  const [form, setForm] = useState<CourtDetailsForm>(() => ({
    name: court.name,
    eurosPerHour: formatEurosInput(court.hourlyPriceCents),
  }));

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    editCourtDetails.mutate(
      { courtId: court.id, details: { name: form.name, hourlyPriceCents: parseEurosToCents(form.eurosPerHour) } },
      {
        onSuccess: () => {
          void navigate({ to: "/courts" });
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      <label className="block space-y-1 text-sm font-medium">
        <span>Name</span>
        <input
          type="text"
          required
          maxLength={COURT_NAME_MAX_LENGTH}
          className={INPUT_CLASS_NAME}
          value={form.name}
          onChange={(event) => {
            setForm({ ...form, name: event.target.value });
          }}
        />
      </label>
      <div className="space-y-1 text-sm font-medium">
        <span>Sport</span>
        <p className="font-normal text-slate-600">
          {SPORT_EMOJIS[court.sportType]} {SPORT_LABELS[court.sportType]}
        </p>
      </div>
      <label className="block space-y-1 text-sm font-medium">
        <span>Price per hour (€)</span>
        <input
          type="number"
          required
          min={HOURLY_PRICE_MIN_EUROS}
          max={HOURLY_PRICE_MAX_EUROS}
          step={HOURLY_PRICE_MIN_EUROS}
          inputMode="decimal"
          className={INPUT_CLASS_NAME}
          value={form.eurosPerHour}
          onChange={(event) => {
            setForm({ ...form, eurosPerHour: event.target.value });
          }}
        />
        <span className="block text-xs font-normal text-slate-500">Existing bookings keep their price.</span>
      </label>
      {editCourtDetails.isError && (
        <p role="alert" className="text-sm text-red-600">
          {readErrorMessage(editCourtDetails.error)}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={editCourtDetails.isPending}
          className="rounded-md bg-emerald-700 px-3 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {editCourtDetails.isPending ? "Saving..." : "Save changes"}
        </button>
        <Link to="/courts" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          Cancel
        </Link>
      </div>
    </form>
  );
}
