# AI usage

Documentation of how AI was used during this technical assessment, as required by the assignment.

The full chronological list of sessions — with the verbatim prompts, what each one produced and what was decided or corrected by hand — is in **[`sessions.md`](./sessions.md)**.

---

## 1. Tools used

- **Claude Code** (Claude Opus 5) — run from the terminal, with the repository as the working directory. Thirteen sessions on 10 November 2026, listed in `sessions.md`.
- No other AI tool was used: no autocomplete assistant, no web chat, no code generator.

---

## 2. Main prompts

Prompts were in Spanish and are quoted verbatim in `sessions.md`. The ones that actually shaped the project:

1. **Turn the PDF statement into an executable spec** (session 1). Requirements, decisions already taken and implementation instructions for backend and frontend in a single file → `CLAUDE.md`, used as the source of truth by every later session.
2. **Audit the inherited repository** (sessions 1 and 3). Which parts of the previous project (a news API with LLM enrichment and boolean search) had to go, which scaffolding was worth keeping, and which configuration mismatches prevented the project from starting.
3. **Build the backend domain** (session 4). Schema and migration with indexes, centralized enums, the status machine as a pure module, transactional services, the four consistency checks with dry run, and the seed with the deliberately corrupted block.
4. **Build the frontend** (session 6), after reviewing endpoint completeness against what the UI needed: router, pages, `actions/`, hooks, components and the centralized status map.
5. **Example request bodies for Postman** (session 5), used to exercise every endpoint by hand before the frontend existed.
6. **Review the delivery** (session 12). Builds, both test suites, schema and seed from scratch, and the API exercised with `curl` — which is where the defects in § 5 were found.

The rest were small, targeted asks: README wording, environment file naming, IDE TypeScript errors, repository clean-up and keeping this log up to date (session 13).

---

## 3. Parts produced with AI assistance

Essentially all the code in the repository was written in the sessions above, always from an explicit instruction and reviewed before committing:

- `CLAUDE.md` and `README.md`.
- **Backend** — entities, migration, enums, status machine, services, DTOs, consistency queries, seed, three test suites.
- **Frontend** — router, pages, actions, hooks, components, status/priority map, two tests.
- **Environment** — `docker-compose.yaml`, the three `.env.example` files, TypeORM CLI scripts.
- This `ai-process/` folder.

What was **not** AI-produced: the stack decision, the Postman collection (exported from manual testing), and the judgement calls in § 4.

---

## 4. Decisions and corrections made manually

- **Stack deviation.** Solving the assessment with NestJS + PostgreSQL + React instead of PHP + Laravel + MySQL was agreed with the company beforehand; a human decision, documented in the README, not an AI suggestion.
- **Diagnostic as endpoints instead of a CLI command.** Chosen so the consistency report can be invoked from Swagger, `curl` and the UI itself.
- **Which inconsistencies are *not* repaired automatically.** The policy — "status ≠ last log" and "broken log chain" are flagged for manual review instead of being fixed — was a deliberate call: there is not enough information to decide which side is the truth, and guessing would destroy evidence.
- **Keeping the scope small.** Proposals that added abstraction layers, and the optional endpoints suggested in session 6, were rejected in favour of direct, readable implementations within the stated scope.
- **A committed fix was rolled back** (session 8) because the approach was not convincing, instead of being kept just because it was already pushed.
- **A mid-execution instruction was reversed** (session 10): the Postman collection stays where it was already documented, `docs/postman/`.
- **Every endpoint was tested by hand in Postman** before the frontend was written, and the project was brought up from scratch with Docker before each commit.

---

## 5. Errors found in the AI output and how they were corrected

- **Environment mismatch, not spotted until the audit.** The root `.env` created the database `optima_retail_db` while `backend/.env` pointed to `media_signal_db`, and the two disagreed on `DB_USER` vs `DB_USERNAME`, so the backend could not connect to a database the container never created. Fixed by unifying both files on `DB_USERNAME` / `DB_NAME=optima_retail_db`.
- **README referencing non-existent assets.** The rewritten README kept image embeds (`docs/images/swagger.png`, `docs/images/llm-usage.png`) inherited from the previous project. The broken embeds and the empty folder were removed.
- **`yarn migration:run` did not exist.** The scripts inherited from the previous project had no TypeORM CLI entry, and the project still relied on `synchronize: true`. Fixed by adding the `typeorm` / `migration:*` scripts against `src/config/data-source.ts` and turning synchronization off.
- **README described a global exception filter that did not exist** (found in session 12). `ExceptionHandlerService` was declared in `CommonModule` but injected nowhere, so database errors surfaced as raw Postgres messages inside a 500. Fixed by writing the filter the README promised (`src/common/filters/all-exceptions.filter.ts`, registered in `main.ts`) and deleting the dead service and its now-empty module.

The pattern worth noting: the AI output was never accepted because it looked right. Half of these defects only showed up by running the thing — builds, tests, a schema rebuilt from scratch and `curl` against the live API.
