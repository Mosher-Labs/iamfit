# DECISIONS.md — iamfit

Append-only log. Strategic/scope/spend decisions only — task-level work lives
on the GitHub Project board. Each entry: date, decision, who decided, why.
New entries proposed by an agent session should be marked PROPOSED and wait
for the human (silent-investor model: hands-off on execution, sign-off
required here) to mark them CONFIRMED before being acted on.

---

**Name & domain** — CONFIRMED
Project named "iamfit" (pun: IAM + "I am fit" — fitness/shredded-policy
vocabulary). Domain iamfit.dev purchased via Cloudflare Registrar.

**Repo structure** — CONFIRMED
Single monorepo, `mosher-labs/iamfit`, with `core/`, `cli/`, `worker/`,
`ledger/`, `site/`. Split into separate repos later only if licensing needs
diverge (e.g. OSS core vs proprietary worker) — not before.

**Core approach** — CONFIRMED
Static analysis of Terraform HCL source only — never `plan`/`state` — to avoid
transferring secrets and to keep it usable in environments that restrict
`terraform plan` in CI. Core engine determines required IAM actions per
resource, diffs against a supplied policy, or generates one from scratch for
greenfield code.

**v1 resource scope** — CONFIRMED
IAM, S3, EC2, Lambda, DynamoDB, RDS, VPC core, SQS, SNS, CloudWatch, ECS/EKS
basics (~15 types). Billing/Cost-Center permissions explicitly left out of
scope (documented as a gotcha/callout, not a resource type).

**Open-core / monetization model** — CONFIRMED
Free, local, open-source CLI as the core engine — required for adoption in
regulated environments that won't send Terraform source to a third-party
service. Paid hosted layer: mapping-database live-update API priced via
x402/USDC (low-sensitivity, no customer code involved — safe for crypto),
plus a Stripe/USD hosted dashboard & audit tier for corporate buyers who won't
touch crypto.

**Self-funding constraint** — CONFIRMED
$150/year hard budget cap, self-imposed, modeled on Austin R.'s badhttp.dev
experiment. Public ledger tracks every dollar in/out.

**Timeline** — CONFIRMED
Two-week MVP target, Lean Startup (build-measure-learn) style. Validated
learning (real user/customer signal) required alongside the build — a working
tool after two weeks is not by itself a validated business; see
LEAN_CANVAS.md.

**Multi-cloud** — CONFIRMED (deferred)
GCP/Azure support explicitly deferred post-v1. Core engine interfaces should
be designed provider-pluggable from the start so this doesn't require a
rewrite later, but no GCP/Azure mapping work happens in v1.

**Naming/branding note** — CONFIRMED
Kept iamfit's branding independent of the user's planned consulting umbrella
(berserker.technology) rather than merging themes — avoids diluting either
name.

**Package manager: Yarn (Berry) over npm** — CONFIRMED (2026-08-25)
Issue #1 originally specified npm workspaces; switched to Yarn (v4, Berry)
workspaces before that scaffold PR merged. Pinned via `packageManager` in
root `package.json` (Corepack) and mirrored in `.mise.toml` for local dev
without Corepack. Using the `node-modules` linker (not PnP) to keep
tsc/vitest/Biome resolution unsurprising.

---

<!-- New entries below this line -->

**`data` source blocks and IAM accuracy** — PROPOSED (2026-08-25)
Issue #2's HCL ingestion intentionally skips `data` blocks (along with
`variable`/`output`/`provider`/`locals`), per that issue's own explicit
scope. Flagged during PR review: this is a real accuracy gap, not just an
ingestion detail — many `data` sources require IAM read permissions during
`terraform plan`/`apply` (e.g. `data.aws_ami` needs `ec2:DescribeImages`,
`data.aws_caller_identity` needs `sts:GetCallerIdentity`), so ignoring them
means iamfit can under-report required permissions for configs that lean on
data sources. Per LEAN_CANVAS.md, accuracy is the whole value prop, so this
is worth a dedicated future issue (data-source -> IAM action mapping,
analogous to the resource -> IAM action mapping in issue #3) rather than
silently living with the gap. Not scoped into #2 or #3 — proposed here for
visibility until scheduled.
