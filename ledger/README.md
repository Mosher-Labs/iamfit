# ledger

Public spend ledger for iamfit. Every dollar in and out, in the open —
mirrors the "pays for itself" constraint from Austin R.'s badhttp.dev
experiment (see `AGENT.md`).

**Budget cap:** $150.00/year, self-imposed. See `LEAN_CANVAS.md` for the
cost-structure rationale and `DECISIONS.md` for the self-funding decision.

## Format

`LEDGER.md` is the source of truth: one row per transaction, oldest first,
running total carried down the `Balance` column. Amounts are USD unless
otherwise noted (a future x402/USDC revenue line would note the original
currency and the USD value at time of receipt).

Append a row for every real transaction — no estimates, no rounding beyond
what the receipt shows. If a `LEAN_CANVAS.md` cost-structure estimate turns
out to differ from the actual charge, the ledger entry is the correct
number; update the estimate in `LEAN_CANVAS.md` to match, not the reverse.
