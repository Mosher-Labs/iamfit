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

**Public ledger URL: `/books`** — PROPOSED (2026-08-25)
Idea floated during ledger scaffolding (see `ledger/`): give the public
spend ledger a `/books` route on iamfit.dev, mirroring Austin R.'s
badhttp.dev convention, once `site/` exists. Not yet built -- `site/` is
still an empty directory in the repo layout. Two open questions before
this is CONFIRMED: (1) whether the page title/route should say "Books" or
"Ledger" for consistency with the `ledger/` directory naming already in
this repo, or whether borrowing Austin's exact term is the point; (2) this
is purely a routing/naming choice, not new spend or scope, so it doesn't
need the spend-decision sign-off process in `AGENT.md` -- just a naming
call whenever `site/` scaffolding starts.

**`diffPolicy` does not evaluate explicit `Deny` statements** — PROPOSED
(2026-08-26)
Flagged during PR #8 review (issue #3, IAM mapping + diff engine):
`diffPolicy` only checks whether some `Allow` statement grants a required
action -- it never checks for an explicit `Deny` on that same action
elsewhere in the policy (common in SCP/permission-boundary-style
documents). This is a false-negative in the "will apply fail" direction:
`diffPolicy` can report an action as covered when AWS would actually deny
it, which is the exact failure mode iamfit exists to catch. Documented as
a v1 limitation in `core/src/diff.ts`'s doc comment; not scoped into
issue #3. Worth a dedicated future issue once real usage shows how often
supplied policies actually carry explicit denies.

**IAM mapping is resource-type-only, not argument-aware** — PROPOSED
(2026-08-26)
Flagged during PR #8 review: `RESOURCE_IAM_ACTIONS` (`core/src/mapping.ts`)
keys purely on Terraform resource *type*, never inspecting a resource's
`arguments`. Concrete gap: an `aws_instance` with `iam_instance_profile`
set requires `iam:PassRole` on the associated role -- a well-known,
commonly-missed real-world IAM permission (and exactly the kind of
piecemeal-discovered pain `AGENT.md` cites as this project's origin at
Charter). Not exercised by current fixtures (no `iam_instance_profile` in
`ec2-instance.tf`), so out of issue #3's literal scope, but worth a
follow-up issue once argument-aware mapping is prioritized.

**Mapping-data maintenance strategy: hand-authored vs. generated** —
PROPOSED (2026-08-26)
Raised after issue #3 shipped the first hand-curated `RESOURCE_IAM_ACTIONS`
seed: a purely hand-maintained type -> IAM-actions table doesn't scale past
v1's ~15 resource types, and per LEAN_CANVAS.md mapping accuracy is the
whole value prop, so staleness here is a real long-term risk, not a
nitpick. True dynamic/runtime discovery (proxying the AWS SDK during a
real `terraform apply`, CloudTrail mining, tools like `iamlive`) was
considered and rejected as a structural mismatch -- it requires executing
infrastructure with live AWS credentials, which breaks the "static
analysis only, never plan/state, no credentials needed locally" bet
already CONFIRMED under Core approach above, and undercuts the exact
regulated-environment trust story this project is betting on. The
likelier long-term answer, not started: keep the *shipped* mapping data
static (still a local data file, no runtime network/execution) but stop
hand-authoring it -- generate it from the public, versioned
`terraform-provider-aws` Go source (each resource's Create/Update handler
shows the real AWS SDK calls it makes) as a periodic build/CI step tied to
provider version bumps, so drift becomes an auditable diff against
upstream instead of silent rot. Not worth building until v1 proves real
user pull, per LEAN_CANVAS.md's validate-before-scaling stance -- logged
here so the eventual answer isn't lost or re-litigated from scratch.

**`Sid` (statement ID) checks: out of scope for `diffPolicy`** — PROPOSED
(2026-08-26)
Raised during PR #8 review: `IamStatement` has no `Sid` field, and
`diffPolicy` never looks for one. Decision: `Sid` is a purely
human-readable statement label with zero effect on how IAM evaluates or
grants a policy, so it has no bearing on "which actions are missing" --
the diff engine's actual job. If an org wants every statement in a
generated/reviewed policy to carry a `Sid` for audit-trail reasons,
that's a genuine but separate capability (policy-authoring-quality
linting, not permission diffing) -- see the HCL-level linting entry
below, which is the more natural home for it.

**Future feature: HCL-level policy-authoring lint (pre-JSON)** — PROPOSED
(2026-08-26)
Raised during PR #8 review: `diffPolicy` only ever sees an
already-rendered `IamPolicyDocument` JSON object, agnostic of where it
came from. In practice a lot of "existing policy" input is itself
authored in Terraform (`aws_iam_policy_document` data source +
`jsonencode`), and once that's flattened to JSON, structural information
is gone -- e.g. redundant `Effect = "Allow"` blocks that could be merged,
or statements missing a `Sid` if an org mandates one. A future feature
could reuse the `ingest.ts` HCL-parsing pipeline to read
`data "aws_iam_policy_document"` blocks directly and lint them before
they ever reach JSON, catching authoring-quality issues no JSON-level
check can see. This is a distinct feature from issue #3's diff engine
(policy-authoring lint vs. permission-diff), not a retrofit of
`diffPolicy` -- worth its own future issue once prioritized.
