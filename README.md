## Why a React SPA (Vite) and not Next.js

The assignment does not allow route handlers in the Next.js app, so with a separate backend the Next.js app would be client-only. All pages are behind login, so SSR gives no value, and Next.js would add either a Node server or, with static export, no dynamic routes like `/admin/users/:id/bookings`. Next.js would also work, but for this scope React + Vite + a client-side router is simpler.

## Why Express and not Nest.js

For a new long-lived project with many features and user permissions, I would pick Nest.js, because its standard structure makes the codebase predictable for LLMs. For this assignment I pick Express, only because I do not know Nest.js yet. I must be able to defend each line at the interview, and a few days is not enough to learn Nest.js and build the assignment to that level.

## Why Postgres

I selected a relational database instead of MongoDB, because foreign keys make sure that each booking links to a valid user and court. I selected Postgres because one exclusion constraint prevents active bookings that overlap on the same court. MySQL needs one row for each 1-hour slot, a second table, and a transaction to do this. For one country with about 3,500 courts, I expect one Postgres database to be fast enough, but I did not do a load test.
