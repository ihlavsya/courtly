## How to run

Needs Docker and free ports `8080`, `5432`.

```sh
git clone https://github.com/ihlavsya/courtly.git && cd courtly
docker compose up
```

- App: http://localhost:8080 (API at `/api/`)
- Users (password `courtly-demo`): `player@courtly.test`, `player2@courtly.test`, `admin@courtly.test`

## Why a React SPA (Vite) and not Next.js

The assignment does not allow route handlers in the Next.js app, so with a separate backend the Next.js app would be client-only. All pages are behind login, so SSR gives no value, and Next.js would add either a Node server or, with static export, no dynamic routes like `/admin/users/:id/bookings`. Next.js would also work, but for this scope React + Vite + a client-side router is simpler.

## Why Express and not Nest.js

For a new long-lived project with many features and user permissions, I would pick Nest.js, because its standard structure makes the codebase predictable for LLMs. For this assignment I pick Express, because with Nest.js I would have to learn the framework and build the app in the same few days. Express is simpler: it has fewer concepts (no modules, providers, decorators or dependency injection), and I already used it a bit, so I can explain and change each line at the interview.

## Why Postgres

I selected a relational database instead of MongoDB, because foreign keys make sure that each booking links to a valid user and court. I selected Postgres because one exclusion constraint prevents active bookings that overlap on the same court. MySQL has no such constraint, so I would need to do less elegant workaround. For one country with about 3,500 courts, I expect one Postgres database to be fast enough, but I did not do a load test.

## How I prevent double bookings

An exclusion constraint on the `bookings` table rejects a new row if an active (not cancelled) booking on the same court has an overlapping time range (`EXCLUDE USING gist (court_id WITH =, time_slot WITH &&) WHERE (cancelled_at IS NULL)`). Postgres checks the constraint as part of the insert, not in a separate read before it, so when two requests come at the same instant, the second one waits for the first one to commit and then fails. The API then returns `409 Conflict`.

### Why there is no test for double bookings

The double-booking rule is one SQL constraint, not TypeScript code, so a unit test cannot run it. A test that sends two bookings at the same time would check that Postgres works, not my code. The SQL shows each rule: same-court bookings cannot overlap (`court_id WITH =`, `time_slot WITH &&`), back-to-back bookings are allowed (`'[)'` ranges), and cancelled bookings free the slot (`WHERE (cancelled_at IS NULL)`). With more time, I would add a database test for these rules, so a later change to the constraint cannot break them unnoticed.
