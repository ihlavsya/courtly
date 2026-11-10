import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { readErrorMessage } from "../api/client.ts";
import type { AdminCourt, CourtStatus } from "../api/courts.ts";
import { adminCourtsQueryOptions, useChangeCourtStatus } from "../api/courts.ts";
import { formatPrice } from "../shared/money.ts";
import { SPORT_EMOJIS } from "../shared/sports.ts";
import { BADGE_CLASS_NAME, TABLE_CELL_CLASS_NAME } from "../shared/styles.ts";

type StatusChangeAction = {
  label: string;
  pendingLabel: string;
  nextStatus: CourtStatus;
};

const ACTION_CLASS_NAME = "rounded-md border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50";

const DEACTIVATE_ACTION: StatusChangeAction = {
  label: "Deactivate",
  pendingLabel: "Deactivating...",
  nextStatus: { isActive: false },
};

const REACTIVATE_ACTION: StatusChangeAction = {
  label: "Reactivate",
  pendingLabel: "Reactivating...",
  nextStatus: { isActive: true },
};

export function CourtsPage() {
  const courtsQuery = useQuery(adminCourtsQueryOptions);

  return (
    <section>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Courts</h1>
        <Link
          to="/courts/new"
          className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800"
        >
          New court
        </Link>
      </div>
      {courtsQuery.isPending && <p className="text-slate-500">Loading courts...</p>}
      {courtsQuery.isError && (
        <p role="alert" className="text-red-600">
          Could not load courts. Try again.
        </p>
      )}
      {courtsQuery.isSuccess && <CourtsTable courts={courtsQuery.data} />}
    </section>
  );
}

function CourtsTable({ courts }: { courts: AdminCourt[] }) {
  if (courts.length === 0) return <p className="text-slate-500">No courts yet. Create the first one.</p>;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left">
        <thead className="border-b border-slate-200 text-sm text-slate-500">
          <tr>
            <th className={`${TABLE_CELL_CLASS_NAME} font-medium`}>Court</th>
            <th className={`${TABLE_CELL_CLASS_NAME} font-medium`}>Price per hour</th>
            <th className={`${TABLE_CELL_CLASS_NAME} font-medium`}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {courts.map((court) => (
            <CourtRow key={court.id} court={court} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CourtRow({ court }: { court: AdminCourt }) {
  return (
    <tr>
      <td className={TABLE_CELL_CLASS_NAME}>
        <span className="flex items-center gap-3">
          <span role="img" aria-label={court.sportType}>
            {SPORT_EMOJIS[court.sportType]}
          </span>
          {court.name}
          {!court.isActive && (
            <span className={`${BADGE_CLASS_NAME} bg-amber-100 text-amber-800`}>
              Deactivated
            </span>
          )}
        </span>
      </td>
      <td className={TABLE_CELL_CLASS_NAME}>{formatPrice(court.hourlyPriceCents)}</td>
      <td className={`${TABLE_CELL_CLASS_NAME} space-x-2 whitespace-nowrap`}>
        <Link to="/day-bookings" className={ACTION_CLASS_NAME}>
          Preview bookings
        </Link>
        <Link to="/courts/$courtId/edit" params={{ courtId: court.id }} className={ACTION_CLASS_NAME}>
          Edit details
        </Link>
        <CourtStatusButton court={court} />
      </td>
    </tr>
  );
}

function CourtStatusButton({ court }: { court: AdminCourt }) {
  const changeCourtStatus = useChangeCourtStatus();
  const action = court.isActive ? DEACTIVATE_ACTION : REACTIVATE_ACTION;

  return (
    <>
      <button
        type="button"
        disabled={changeCourtStatus.isPending}
        onClick={() => {
          changeCourtStatus.mutate({ courtId: court.id, status: action.nextStatus });
        }}
        className={`${ACTION_CLASS_NAME} disabled:opacity-50`}
      >
        {changeCourtStatus.isPending ? action.pendingLabel : action.label}
      </button>
      {changeCourtStatus.isError && (
        <span role="alert" className="text-sm text-red-600">
          {readErrorMessage(changeCourtStatus.error)}
        </span>
      )}
    </>
  );
}
