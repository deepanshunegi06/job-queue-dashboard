# Mini Job Queue Dashboard

A small job queue manager: React + shadcn/ui on the front, NestJS + TypeORM on the back.

- **Frontend:** https://job-queue-dashboard-phi.vercel.app
- **API:** _add link after deploy_

## Running it locally

Two terminals.

```bash
cd api
npm install
npm run start:dev        # http://localhost:3000
```

```bash
cd web
npm install
npm run dev              # http://localhost:5173
```

The API creates `api/jobs.sqlite` on first boot, so there is nothing to migrate or seed.

### Environment variables

| Where | Variable | Default | Notes |
| --- | --- | --- | --- |
| api | `PORT` | `3000` | |
| api | `SQLITE_PATH` | `jobs.sqlite` | Ignored when `DATABASE_URL` is set |
| api | `DATABASE_URL` | – | Switches TypeORM to Postgres |
| api | `PGSSL` | – | Set to `require` for hosted Postgres |
| api | `CORS_ORIGIN` | any origin | Comma separated list |
| web | `VITE_API_URL` | `http://localhost:3000` | |

## API

| Method | Route | Notes |
| --- | --- | --- |
| `GET` | `/jobs?status=` | Newest first, optional status filter |
| `GET` | `/jobs/counts` | `{ pending, running, completed, failed }` |
| `POST` | `/jobs` | `{ title, type }`, starts as `pending` |
| `PATCH` | `/jobs/:id/status` | `{ status }` |
| `DELETE` | `/jobs/:id` | `204` |
| `GET` | `/jobs/:id/history` | Transition log for one job |

Errors come back as `400` for bad input, `404` for unknown ids and `409` when a
status change is not allowed from the job's current state.

## The concurrency question

Two tabs both see a job as `pending` and both press Start. Without care, the
second write silently overwrites the first, and two workers think they own the
same job.

**Where the rule lives.** In the API, not in React. The frontend only decides
which buttons to render — anyone with curl can skip that. The transition table
(`api/src/jobs/job-status.ts`) is keyed by target status, and every target has
exactly one legal source, so the check collapses into the update itself:

```sql
UPDATE jobs SET status = 'running', version = version + 1
WHERE id = ? AND status = 'pending'
```

**Why that fixes the race.** The expected status travels inside the `WHERE`
clause, so the database — which already serialises row writes — picks the
winner. The first request updates one row. The second matches zero rows, and
zero rows is the signal that someone got there first: the service re-reads the
job and answers `409` with the status it actually has now. No read-then-write
gap to lose a write in, and no lock held across a round trip.

Reading the row first and then updating it would have the same gap the two tabs
do, just moved server-side, so the check and the write have to be one statement.

**On the client.** A `409` is treated as information rather than a failure: the
dashboard shows what really happened ("Job is already running") and refetches,
so the stale tab corrects itself instead of arguing with the server.

This holds on Postgres for the same reason it holds on sqlite, so nothing about
the approach changes when the database does.

## Small production-ready addition

Every accepted transition writes a row to `job_events` (`from`, `to`, `at`),
exposed at `GET /jobs/:id/history`.

The first question anyone asks about a stuck or failed job is "what happened to
it and when" — a `status` column can't answer that, because each write erases
the previous answer. It is also what you need to work out whether a job sat in
`pending` for six hours or failed twice in a row. It costs one insert per
transition and turns the queue from a snapshot into something you can debug.

## Assumptions and trade-offs

- `synchronize: true` keeps the schema in sync automatically. Fine at this size;
  a real deployment wants proper migrations.
- The audit insert happens right after the update instead of inside a
  transaction. Wrapping both would serialise every status change behind a single
  sqlite write lock, and a missing history row is a much cheaper failure than a
  blocked queue.
- `version` is incremented on every transition. Nothing reads it yet — it is
  there for the moment a `PATCH` needs to carry an `If-Match`-style precondition
  for fields other than status.
- Jobs are listed in full. Pagination becomes necessary somewhere around a few
  hundred rows.
- The dashboard refetches after every mutation rather than patching local state.
  One extra request, and the UI can never drift from the server.
- Deletes are hard deletes. A soft delete would preserve history, but the
  assignment asked for `DELETE /jobs/:id`.

## With more time

- SSE or websockets so a second tab sees a status change without a refresh,
  instead of finding out through a `409`.
- Something that actually runs the jobs (BullMQ), with a worker that claims
  `pending` work using the same conditional update.
- Rate limiting and request logging on the API.
- Component tests for the dashboard; right now only the transition rules are
  covered (`cd api && npm test`).

## Deploying

`render.yaml` deploys the API as-is. Note that the free tier has no persistent
disk, so sqlite resets when the instance restarts — set `DATABASE_URL` (and
`PGSSL=require`) to point at Postgres and it switches over with no code change.

The frontend is a static Vite build: `npm run build` in `web/`, deploy `dist/`,
and set `VITE_API_URL` to the API URL.
