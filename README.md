## Why a React SPA (Vite) and not Next.js

The assignment does not allow route handlers in the Next.js app. SSR and server actions are still possible, but with a separate backend they split the backend logic into two places, which is harder to maintain. So the Next.js app would be client-only, and most Next.js features give no value here:

- **SSR/SSG for SEO:** all pages are behind login. If we need a public landing page later, it can be a separate static page.
- **Image optimization:** right now the app does not need it. If the app needs it later, it can be done without Next.js in other ways.
- **File-based routing:** this is not unique to Next.js. Client-side routers like TanStack Router also have it.

Next.js also adds costs that a Vite SPA does not have:

- **A server for client-only pages.** By default, Next.js needs a running Node server, even when every page renders in the browser. That is extra infrastructure for no benefit. Static export (`output: 'export'`) removes the server, and with it middleware (Proxy), request-based API routes, server-side image optimization, ISR and Server Actions. It also breaks dynamic routes (see below).
- **No dynamic routes in static export.** A page like `/admin/users/[id]/bookings` fails the build unless every `id` is known at build time. The workarounds are query params (`?userId=123`) or host rewrites. In a Vite SPA, `/admin/users/:id/bookings` works out of the box.

Also, React gives **Simpler mental model.** compared to Next.js. There is no server/client component split, no `'use client'` boundaries.

## Next.js would also work. For this scope, React + Vite + a client-side router is simpler.

---

## Nest.js vs Express

**For a new long-lived project with many features and user permissions, I would pick Nest.js.** The app in this assignment is a small version of that kind of project. LLMs copy the conventions they see and they work best in boring, predictable codebases. Nest.js helps in the following way:

**Known shape** Controllers, pipes, guards and DI each have a standard place, so there are fewer ways to do the same thing. Express has many common shapes, so LLMs and new devs must learn each repo's own.

A rigid Express repo with fixed folders and lint rules can get close, but it takes more work to set it up, while Nest.js has a lot of structure right from the start.

**For this assignment I pick Express, only because I do not know Nest.js yet. If I already knew it, I would use it here.** I must be able to defend each line at the interview, and a few days is not enough to learn Nest.js and build the assignment to that level.
