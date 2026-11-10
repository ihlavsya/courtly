import { Link, useNavigate } from "@tanstack/react-router";
import type { SubmitEvent } from "react";
import { useState } from "react";
import { readErrorMessage } from "./api/client.ts";
import type { SportType } from "./api/courts.ts";
import {
  COURT_NAME_MAX_LENGTH,
  HOURLY_PRICE_MAX_EUROS,
  HOURLY_PRICE_MIN_EUROS,
  useCreateCourt,
} from "./api/courts.ts";
import { parseEurosToCents, SPORT_EMOJIS, SPORT_LABELS, SPORT_TYPES } from "./courtDisplay.ts";
import { INPUT_CLASS_NAME } from "./formStyles.ts";

type NewCourtForm = {
  name: string;
  sportType: SportType;
  eurosPerHour: string;
};

const EMPTY_NEW_COURT_FORM: NewCourtForm = { name: "", sportType: "tennis", eurosPerHour: "" };

export function NewCourtPage() {
  const createCourt = useCreateCourt();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_NEW_COURT_FORM);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    createCourt.mutate(
      { name: form.name, sportType: form.sportType, hourlyPriceCents: parseEurosToCents(form.eurosPerHour) },
      {
        onSuccess: () => {
          void navigate({ to: "/courts" });
        },
      },
    );
  }

  return (
    <section className="max-w-md">
      <h1 className="mb-6 text-2xl font-semibold">New court</h1>
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
        <label className="block space-y-1 text-sm font-medium">
          <span>Sport</span>
          <select
            className={INPUT_CLASS_NAME}
            value={form.sportType}
            onChange={(event) => {
              setForm({ ...form, sportType: event.target.value as SportType });
            }}
          >
            {SPORT_TYPES.map((sportType) => (
              <option key={sportType} value={sportType}>
                {SPORT_EMOJIS[sportType]} {SPORT_LABELS[sportType]}
              </option>
            ))}
          </select>
        </label>
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
        </label>
        {createCourt.isError && (
          <p role="alert" className="text-sm text-red-600">
            {readErrorMessage(createCourt.error)}
          </p>
        )}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={createCourt.isPending}
            className="rounded-md bg-emerald-700 px-3 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {createCourt.isPending ? "Creating..." : "Create court"}
          </button>
          <Link to="/courts" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
