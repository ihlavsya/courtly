const ACTION_CLASS_NAME = "rounded-md border border-slate-200 px-3 py-1 text-sm text-slate-400";

export function CourtsPage() {
  return (
    <section>
      <h1 className="mb-6 text-2xl font-semibold">Courts</h1>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left">
          <thead className="border-b border-slate-200 text-sm text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Court</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-3">Tennis court</td>
              <td className="space-x-2 px-4 py-3 whitespace-nowrap">
                <button type="button" disabled className={ACTION_CLASS_NAME}>
                  Preview bookings
                </button>
                <button type="button" disabled className={ACTION_CLASS_NAME}>
                  Edit details
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
