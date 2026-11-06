## Why a React SPA (Vite) and not Next.js

The assignment does not allow route handlers in the Next.js app. SSR and server actions are still possible, but with a separate backend they split the backend logic into two places, which is harder to maintain. So the Next.js app would be client-only, and most Next.js features give no value here:

- **SSR/SSG for SEO:** all pages are behind login. If we need a public landing page later, it can be a separate static page.
- **Image optimization:** right now the app does not need it. If the app needs it later, it can be done without Next.js in other ways.
- **File-based routing:** this is not unique to Next.js. Client-side routers like TanStack Router also have it.

Next.js also adds costs that a Vite SPA does not have:

- **A server for client-only pages.** By default, Next.js needs a running Node server, even when every page renders in the browser. That is extra infrastructure for no benefit. Static export (`output: 'export'`) removes the server (middleware, request-based API routes, server-side image optimization, ISR, Server Actions), but it breaks dynamic routes (see below).
- **No dynamic routes in static export.** A page like `/admin/users/[id]/bookings` fails the build unless every `id` is known at build time. The workarounds are query params (`?userId=123`) or host rewrites. In a Vite SPA, `/admin/users/:id/bookings` works out of the box.
- **Simpler mental model.** There is no server/client component split, no `'use client'` boundaries.

Next.js would also work. For this scope, React + Vite + a client-side router is simpler.
