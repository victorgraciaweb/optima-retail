# AI usage

Documentation of how AI was used during this technical assessment, as required by the assignment.

> Work in progress — this file is updated as the implementation advances.

---

## 1. Tools used

- **Claude Code** (Claude Opus 5) — used from the terminal, with the repository as context.

---

## 2. Main prompts

Summary of the prompts that actually shaped the project:

- **Turning the PDF statement into an executable spec.** The assignment was handed over together with the existing repository and the request was to produce a single source of truth with the literal requirements, the decisions already taken and the implementation instructions for backend and frontend. Output: `CLAUDE.md`.
- **Auditing the inherited repository.** Asking which parts of the previous project (a news API with LLM enrichment and boolean search) had to be deleted, which scaffolding was worth keeping, and which environment/config mismatches would prevent the project from starting.
- **README review.** Asking which parts of the README still described the previous project, and proposing the changes before applying them.

(To be extended with the prompts used for the backend and frontend implementation.)

---

## 3. Parts produced with AI assistance

- `CLAUDE.md` — executable specification of the assessment.
- `README.md` — full rewrite for the incident panel.
- Environment clean-up (`.env.example`, unification of `DB_USERNAME` / `DB_NAME`).

(To be extended.)

---

## 4. Decisions and corrections made manually

- **Stack deviation.** Solving the assessment with NestJS + PostgreSQL + React instead of PHP + Laravel + MySQL was agreed with the company beforehand; it is a human decision, documented in the README, not an AI suggestion.
- **Diagnostic as endpoints instead of a CLI command.** Chosen so the consistency report can be invoked from Swagger, curl and the UI itself.
- **Which inconsistencies are *not* repaired automatically.** The policy ("status ≠ last log" and "broken log chain" are flagged for manual review instead of being fixed) was a deliberate call: there is not enough information to decide which side is the truth, and guessing would destroy information.
- **Keeping the scope small.** Several proposals that added abstraction layers were rejected in favour of direct, readable implementations.

---

## 5. Errors found in the AI output and how they were corrected

- **Environment mismatch not spotted until the audit.** The root `.env` created the database `optima_retail_db` while `backend/.env` pointed to `media_signal_db`, so the backend could not connect to a database the container never created. Fixed by unifying both files on `DB_USERNAME` / `DB_NAME=optima_retail_db`.
- **README referencing non-existent assets.** The rewritten README initially kept image embeds (`docs/images/swagger.png`, `docs/images/llm-usage.png`) inherited from the previous project, whose files do not exist in this repository. The broken embeds were removed.

(To be extended.)
