import { useQuery } from "@tanstack/react-query";
import type { LinkProps } from "@tanstack/react-router";
import { Link, Outlet } from "@tanstack/react-router";
import type { UserRole } from "./api/auth.ts";
import { currentSessionQueryOptions } from "./api/auth.ts";

type MenuItem = {
  label: string;
  path?: LinkProps["to"];
};

const MENU_ITEMS_BY_ROLE: Record<UserRole, MenuItem[]> = {
  player: [{ label: "Book a court", path: "/bookings/new" }, { label: "My bookings", path: "/bookings" }],
  admin: [{ label: "Courts", path: "/courts" }],
};

export function AppLayout({ role }: { role: UserRole }) {
  const sessionQuery = useQuery(currentSessionQueryOptions);
  const userEmail = sessionQuery.data?.user?.email;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-4xl items-center gap-6 px-4 py-4">
          <span className="font-semibold text-emerald-700">Courtly</span>
          {MENU_ITEMS_BY_ROLE[role].map(renderMenuItem)}
          {userEmail !== undefined && <span className="ml-auto text-sm text-slate-500">{userEmail}</span>}
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

function renderMenuItem({ label, path }: MenuItem) {
  if (path === undefined) {
    return (
      <span key={label} className="text-sm text-slate-400">
        {label}
      </span>
    );
  }

  return (
    <Link key={label} to={path} className="text-sm font-medium text-slate-700 hover:text-emerald-700">
      {label}
    </Link>
  );
}
