import { createRootRoute, createRoute, createRouter, Outlet, redirect } from "@tanstack/react-router";
import type { UserRole } from "./api/auth.ts";
import { currentSessionQueryOptions } from "./api/auth.ts";
import { queryClient } from "./api/client.ts";
import { AppLayout } from "./AppLayout.tsx";
import { CourtsPage } from "./CourtsPage.tsx";
import { DayReportPage } from "./DayReportPage.tsx";
import { LoginPage } from "./LoginPage.tsx";
import { MyBookingsPage } from "./MyBookingsPage.tsx";
import { NewBookingPage } from "./NewBookingPage.tsx";

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const HOME_PATH_BY_ROLE = {
  player: "/bookings/new",
  admin: "/courts",
} as const satisfies Record<UserRole, string>;

const rootRoute = createRootRoute({ component: Outlet });

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: redirectToHomePage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  beforeLoad: redirectLoggedInUserToHomePage,
  component: LoginPage,
});

const playerRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "player",
  beforeLoad: () => requireRole("player"),
  component: () => <AppLayout role="player" />,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "admin",
  beforeLoad: () => requireRole("admin"),
  component: () => <AppLayout role="admin" />,
});

const newBookingRoute = createRoute({
  getParentRoute: () => playerRoute,
  path: "/bookings/new",
  component: NewBookingPage,
});

const myBookingsRoute = createRoute({
  getParentRoute: () => playerRoute,
  path: "/bookings",
  component: MyBookingsPage,
});

const courtsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/courts",
  component: CourtsPage,
});

const dayReportRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/day-bookings",
  component: DayReportPage,
});

export const router = createRouter({
  routeTree: rootRoute.addChildren([
    homeRoute,
    loginRoute,
    playerRoute.addChildren([newBookingRoute, myBookingsRoute]),
    adminRoute.addChildren([courtsRoute, dayReportRoute]),
  ]),
});

async function redirectToHomePage() {
  const { user } = await loadCurrentSession();

  throw redirect({ to: user === undefined ? "/login" : HOME_PATH_BY_ROLE[user.role] });
}

async function redirectLoggedInUserToHomePage() {
  const { user } = await loadCurrentSession();

  if (user !== undefined) throw redirect({ to: HOME_PATH_BY_ROLE[user.role] });
}

async function requireRole(requiredRole: UserRole) {
  const { user } = await loadCurrentSession();

  if (user === undefined) throw redirect({ to: "/login" });
  if (user.role !== requiredRole) throw redirect({ to: HOME_PATH_BY_ROLE[user.role] });
}

function loadCurrentSession() {
  return queryClient.query({ ...currentSessionQueryOptions, staleTime: "static" });
}
