# Optima Retail — Operational incident panel

Full-stack application to track and operate support incidents, built on a NestJS + PostgreSQL REST API and a React 19 SPA. It enforces a validated status machine (`abierta → en revisión → bloqueada / resuelta`, with explicit reopening), records every critical change in a transactional audit log, and ships a data-consistency diagnostic that detects and safely repairs corrupted traceability with a dry-run mode.

---

# Authorized stack deviation

The assignment asked for **PHP + Laravel + MySQL**. After discussing it with the company, the exercise was solved with an equivalent stack:

| Assignment            | Implemented here                      |
| --------------------- | ------------------------------------- |
| PHP + Laravel         | **NestJS** + TypeScript               |
| MySQL                 | **PostgreSQL 16** (via Docker)        |
| Blade / Livewire / Inertia + React | **React 19 + Vite** (SPA consuming the REST API) |
| Bootstrap or Tailwind | **Tailwind v4 + shadcn/ui**           |
| JavaScript for interaction | TypeScript + TanStack Query      |

**Why:** familiarity with the stack, and PostgreSQL in Docker means nothing has to be installed or configured on the host machine.

Constraints that **are** respected: own HTML/CSS, Tailwind only as visual support, real client-side interaction, and **no Next.js**.

Laravel artifacts were implemented through their direct equivalents:

| Laravel                              | Here                                        |
| ------------------------------------ | ------------------------------------------- |
| Artisan migrations                   | TypeORM migrations (`backend/src/migrations/`) |
| Seeders                              | `yarn seed` (`backend/src/seed/`)           |
| Eloquent                             | TypeORM `Repository` + `QueryBuilder`       |
| `FormRequest` / `$request->validate()` | DTO + `class-validator` + global `ValidationPipe` |
| Model enums / constants              | Centralized TS enums (`src/incidents/enums/`) |
| `DB::transaction()`                  | `dataSource.transaction()`                  |
| Artisan diagnostic command           | Maintenance endpoints (see *Data consistency*) |
| Blade / Inertia                      | React + react-router 7                      |

---

# Requirements

- **Node.js 20+**
- **Docker** and **Docker Compose** (only used to run PostgreSQL 16)
- **yarn** for the backend, **npm** for the frontend — the package managers are not interchangeable here

No PHP, Composer or MySQL installation is needed.

---

# Tech stack

### Backend

NestJS 10 · TypeScript 5.9 · TypeORM 0.3 · `pg` · `@nestjs/swagger` · `class-validator` / `class-transformer` · Jest 29

### Frontend

React 19 · Vite 8 · react-router 7 · TanStack Query 5 · axios · Tailwind v4 · shadcn/ui · lucide-react · Vitest + Testing Library

### Database

PostgreSQL 16

---

# Project structure

```text
optima-retail/
│
├── backend/              # NestJS REST API
│   └── src/
│       ├── incidents/    # domain: entities, DTOs, enums, services, status machine
│       ├── maintenance/  # consistency diagnostic and repair
│       ├── migrations/   # TypeORM migrations (schema + indexes)
│       ├── seed/         # sample data, including the seeded inconsistencies
│       ├── common/       # pagination DTOs, global exception filter
│       ├── config/       # app config and TypeORM data source
│       └── health/
│
├── frontend/             # React 19 SPA
│   └── src/
│       ├── actions/      # axios calls
│       ├── hooks/        # useQuery / useMutation wrappers
│       ├── interfaces/
│       ├── lib/          # status → label/variant map
│       ├── components/
│       └── pages/
│
├── ai-process/           # AI usage documentation (required by the assignment)
├── docs/                 # Postman collection
│
├── .env.example          # environment template, no real credentials
├── docker-compose.yaml   # PostgreSQL 16
└── README.md
```

---

# Getting started

## 1. Clone the repository

```bash
git clone git@github.com:victorgraciaweb/optima-retail.git
cd optima-retail
```

## 2. Configure environment variables

```bash
cp .env.example .env                      # credentials for the PostgreSQL container
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

The root `.env` feeds `docker-compose.yaml`; `backend/.env` must point to the **same** user, password and database name.

## 3. Start PostgreSQL

From the project root:

```bash
docker compose up -d
```

## 4. Install dependencies

```bash
cd backend  && yarn install
cd ../frontend && npm install
```

## 5. Create the schema and load sample data

```bash
cd backend
yarn migration:run     # creates tables, foreign keys and indexes
yarn seed              # sample incidents + the inconsistencies of exercise 5
```

The seed is the only way to get the corrupted records used by the consistency diagnostic.

## 6. Start the applications

```bash
# backend
cd backend && yarn start:dev      # http://localhost:3000/api

# frontend
cd frontend && npm run dev        # http://localhost:5173
```

---

# Data model

Three tables, all keyed by `uuid`.

### `incidents`

`title`, `description`, `status` (enum), `priority` (enum), `requester_name`, `assigned_to`, `created_at`, `updated_at`, plus three columns that are not in the minimum spec and are justified below:

- `due_at` — enables the "overdue incident" highlight in the UI.
- `needs_review` / `review_reason` — flag an inconsistency that **must not** be repaired automatically.

### `incident_logs`

Traceability of relevant changes: `action` (enum), `old_value`, `new_value`, `user_name`, `metadata` (`jsonb`, carries the reopening reason or the reconstruction flags), `created_at`. FK to `incidents` with `ON DELETE CASCADE`.

### `incident_comments`

Operational follow-up notes: `author_name`, `body`, timestamps. FK to `incidents` with `ON DELETE CASCADE`.

### Indexes

Chosen from the actual query patterns, and created inside the migration — never imperatively from the seed:

- `incidents`: `status`, `priority`, `created_at`, and a composite `(status, priority)` for the combined filter of the main screen.
- `incident_logs` and `incident_comments`: `(incident_id, created_at)` — the history is always read per incident, in chronological order.
- Free-text filter: **GIN** index over a `STORED` generated `tsvector` column built from `title` and `description` with the `spanish` dictionary.

### Centralized statuses

Statuses, priorities and log actions live in enums under `src/incidents/enums/` and are mirrored in a single frontend file (`src/interfaces/incident.interface.ts`). No status string is written by hand in a page, component or service.

---

# Status machine

| From          | Allowed target           |
| ------------- | ------------------------ |
| `abierta`     | `en_revision`            |
| `en_revision` | `bloqueada`, `resuelta`  |
| `bloqueada`   | `en_revision`, `resuelta` |
| `resuelta`    | `abierta` **only as an explicit reopening** |

- The rules live in a pure, testable module (`src/incidents/domain/incident-status.transitions.ts`), not inside the service.
- A forbidden transition returns **409** with an actionable message: `No se puede pasar de "bloqueada" a "abierta". Transiciones válidas: en_revision, resuelta.`
- A transition to the same status also returns **409**, so no empty log is written.
- `resuelta → abierta` requires a non-empty `reason` (**400** otherwise) and is recorded with `action: reopened` and `metadata: { reason }`.

Every action that touches the incident **and** its traceability runs inside a single `dataSource.transaction()`, reading the row with a `pessimistic_write` lock. If the log fails to persist, the status change is rolled back: there is never a status without its log.

---

# API

Global prefix `api`. Interactive documentation at **http://localhost:3000/api/docs**.

| Method  | Route                              | Purpose                                              |
| ------- | ---------------------------------- | ---------------------------------------------------- |
| `POST`  | `/incidents`                       | Create with validation (+ `created` log, transactional) |
| `GET`   | `/incidents`                       | List: `status[]`, `priority[]`, `q`, `assignedTo`, `sort`, `limit`, `offset` |
| `GET`   | `/incidents/stats`                 | Count per status (feeds the visual counter)          |
| `GET`   | `/incidents/:id`                   | Detail                                               |
| `PATCH` | `/incidents/:id/status`            | Status change with validated transition              |
| `GET`   | `/incidents/:id/activity`          | Unified history: logs + comments, chronological      |
| `POST`  | `/incidents/:id/comments`          | Operational comment                                  |
| `GET`   | `/maintenance/consistency`         | Inconsistency report (read-only)                     |
| `POST`  | `/maintenance/consistency/fix`     | Repair; `dryRun: true` by default                    |

Listing uses `limit`/`offset` pagination and returns `{ data, count, pages }`. Filters are applied with conditional `andWhere` and **named parameters** only — user input is never interpolated into SQL.

Validation errors are returned by the global `ValidationPipe` (`whitelist` + `forbidNonWhitelisted`); database and domain errors are normalized by a global exception filter (`src/common/filters/all-exceptions.filter.ts`: Postgres `23503` → 400, `23505` → 409, `NotFound` / `Conflict` / validation errors propagated untouched, anything else → 500 with the stack logged and no internals in the response). The frontend renders field errors inline and everything else in a toast, reading `error.response.data.message`.

---

# Test user / simulated actor

**There is no authentication** — the assignment does not ask for it, so there is no test user to provide.

Traceability still needs an actor, so every mutation carries a validated `actorName` (or `authorName` for comments) in the body. The frontend exposes an actor selector in the header, persists it in `localStorage` and attaches it to every mutation. That value is what ends up in `incident_logs.user_name`.

---

# Interaction (exercise 4)

Four of the proposed behaviours are implemented, instead of the two required:

- **Quick status filter without reloading the page** — status chips write to the URL query params; TanStack Query refetches on the new `queryKey`, no document reload.
- **Confirmation before resolving or blocking** — an `AlertDialog` explains the effect, and reopening additionally requires a reason.
- **Visual counter per status** — fed by `GET /incidents/stats`, invalidated after every mutation.
- **Highlight for overdue or blocked incidents** — the row/card stands out when `status === 'bloqueada'` or when `dueAt` is in the past and the incident is not resolved.

Where the state lives is an explicit rule: filters, pagination and sorting live in the **URL**; server data lives in **TanStack Query** and is never copied into `useState`; only ephemeral UI (open dialog, draft text) uses local state; the selected actor lives in `localStorage`.

---

# Data consistency (exercise 5)

The seed deliberately creates three corrupted records, in a clearly separated and commented block, to simulate a typical maintenance incident.

### Seeded inconsistencies

1. **A `resuelta` incident with no resolution log.**
2. **An incident whose status does not match its last log** (status `bloqueada`, last log says `new_value = 'resuelta'`).
3. **Duplicated / incoherent logs** — two identical `(incident_id, action, old_value, new_value)` rows seconds apart, and a log whose `old_value` does not chain with the previous `new_value`.

### How they are detected

Each check is one documented SQL query under `backend/src/maintenance/queries/`, with a JSDoc block explaining what it detects and **why that detects the problem**:

| Check | Why it detects the problem |
| ----- | -------------------------- |
| Resolved without a resolution log | Every resolution should leave a trace. A final status of `resuelta` with no log introducing it means the change was written outside the transaction that guarantees traceability. |
| Status ≠ last log `new_value` | The last log is by definition the one that set the current status. If they differ, either a log was lost or the status was modified without recording it. |
| Exact duplicate logs | Two identical transitions are not a real fact: a status change can only happen once from a given origin value. |
| Broken log chain | A log's `old_value` must be the previous log's `new_value`. If it does not chain, an intermediate log is missing or some values were written wrongly. |

### Running the diagnostic

The diagnostic is part of the API, so it can be run from Swagger, curl or the `/maintenance` screen.

```bash
# 1. Read-only report, grouped by check
curl http://localhost:3000/api/maintenance/consistency

# 2. Dry run — returns the exact plan of changes, writes nothing (this is the default)
curl -X POST http://localhost:3000/api/maintenance/consistency/fix \
  -H 'Content-Type: application/json' \
  -d '{ "actorName": "Victor Gracia" }'

# 3. Apply, inside a transaction, leaving a consistency_fix audit log per change
curl -X POST http://localhost:3000/api/maintenance/consistency/fix \
  -H 'Content-Type: application/json' \
  -d '{ "actorName": "Victor Gracia", "dryRun": false }'
```

`/maintenance` in the UI shows the report per check, previews the dry run before applying, confirms with an `AlertDialog`, and lists the incidents flagged with `needs_review = true`.

### What is repaired, and what is deliberately not

Not every inconsistency should be fixed automatically when there is not enough information to decide. The report always states `autoFixable: true/false` and, when false, the reason.

| Case                      | Decision | Justification |
| ------------------------- | -------- | ------------- |
| Resolved without a log    | **Auto-fixed**: create the missing log with `action: consistency_fix`, `user_name: 'system'`, `metadata: { reconstructed: true, inferredFrom: 'incidents.status' }` | The final status is an observable fact; only the trace is missing. It is flagged as reconstructed so it is never mistaken for a real trace. |
| Status ≠ last log         | **Not fixed**: `needs_review = true` + `review_reason` | There is no information to decide which side is the truth — a log may have been lost (status correct) or the status may have been overwritten (log correct). Picking one at random would destroy information. Left for manual review. |
| Exact duplicate log       | **Auto-fixed**: keep the oldest, delete the rest | Demonstrable noise: the same transition cannot have happened twice. |
| Broken log chain          | **Not fixed**: flagged for review | The missing intermediate log is unknown; inventing it would falsify the audit trail. |

---

# Health check

```
GET http://localhost:3000/api/health
```

```json
{
  "status": "ok",
  "timestamp": "2026-11-10T18:30:15.123Z",
  "uptime": 452.81
}
```

---

# Tests

Scope is deliberately narrow — the assignment explicitly does not ask for extensive tests.

```bash
cd backend  && yarn test     # Jest
cd frontend && npm test      # Vitest + Testing Library
```

**Backend**

1. `incident-status.transitions.spec.ts` — the full transition table: every allowed move, every rejected move, same-status, and the `resuelta → abierta` reopening.
2. `incident-change-status.service.spec.ts` — the log is written with the right `oldValue` / `newValue` / `userName`, everything happens inside the same transaction, and a failure saving the log prevents the status from being persisted.
3. `consistency.queries.spec.ts` — each check detects its seeded case and produces no false positives on the clean data.

**Frontend**

1. `StatusCounters` renders the per-status count from the mocked hook.
2. The quick status filter updates the query param and requests the filtered data.

---

# Technical decisions

- **Status machine as a pure module.** Keeping the transition map out of the service makes it exhaustively testable without mocking a database, and leaves a single place to change when the workflow changes.
- **One transaction per state-changing action, with a `pessimistic_write` lock.** Two concurrent status changes on the same incident would otherwise produce incoherent logs. The lock serializes them; the transaction guarantees there is no status without its log.
- **Facade + one service per use case.** The controller only talks to `IncidentsService`, which delegates to single-`execute()` services. Each use case stays small and independently testable.
- **Filters in the URL, server data in TanStack Query.** A filtered view is shareable and survives a reload, and server data is never duplicated in local state, so there is a single source of truth for the list.
- **Status indicators centralized in one map** (`src/lib/incident-ui.ts`), consumed by `StatusBadge`. No status colour is hardcoded in a page.
- **Table on `md+`, cards on mobile** — one data source, two presentations, no component above ~150 lines.
- **Explicit migrations instead of `synchronize: true`.** The schema, the foreign keys and the indexes are versioned and reproducible from scratch.
- **Diagnostic as endpoints instead of a CLI command.** It can be invoked from Swagger, curl and the UI itself, and the dry run returns the exact plan before anything is written.
- **No `dangerouslySetInnerHTML` anywhere.** Titles, descriptions and comments are user input and are rendered as text, escaped by React. Maximum lengths are validated on both client and server.

---

# Out of scope

Explicitly not implemented, as stated in the assignment: full authentication, advanced roles and permissions, notifications, extensive test suites, Docker beyond PostgreSQL, public deployment and external integrations.

A small, consistent, runnable solution was preferred over a large incomplete application. Faced with the choice between an extra abstraction layer and a direct, readable implementation, the direct one was chosen.

---

# AI usage

AI was used as an engineering assistant and the process is documented in **`/ai-process`**, as required by the assignment: tools used, main prompts, which parts were AI-assisted, decisions and corrections made manually, and errors found in the AI output and how they were fixed. `ai-process/sessions.md` lists every session in order, with the verbatim prompts and what each one produced.

AI-generated code was never accepted blindly: on several occasions it proposed unnecessary abstraction layers, which were simplified to match the scope of the assessment.

---

# Additional resources

- `ai-process/` → AI usage documentation (`README.md` + `sessions.md`, the session log).
- `docs/postman/` → Postman collection and environment.

---

# License

This project was created exclusively as part of a technical assessment.
