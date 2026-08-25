# AGENT.md — iamfit

Read this file, then `DECISIONS.md`, before doing anything else. You have no memory
of prior sessions — this file and the decision log are your entire context.

## What this is

iamfit statically analyzes Terraform HCL source (never plan/state — no secrets
transit) to determine the exact AWS IAM actions a given set of resources requires,
then either diffs that against an existing role's policy or generates a
least-privilege policy from scratch. It exists to answer, before `terraform apply`
runs: *"will this fail on permissions, and specifically why."*

Modeled on Austin R.'s badhttp.dev/Proxylity experiment (an AI-run, self-funded,
autonomous project) — but adapted: open-core, local-first engine (regulated-
environment customers won't send Terraform source to a third-party SaaS), with a
thin paid hosted layer for what's actually safe to centralize.

## Repo layout

```
core/     HCL parser, AWS resource->IAM action mapping, diff/generation engine
cli/      thin CLI wrapper around core, packaged for npm/homebrew
worker/   Cloudflare Worker — hosted mapping-DB API, x402 (USDC) + Stripe stubs
ledger/   public spend ledger (mirrors Austin's "pays for itself" constraint)
site/     iamfit.dev marketing/docs
```

## v1 scope — locked, do not expand without a DECISIONS.md entry

Resource types: IAM (roles/policies/instance profiles), S3, EC2 (instances,
security groups, EBS), Lambda, DynamoDB, RDS, VPC core (VPC/subnets/route
tables/NAT/IGW), SQS, SNS, CloudWatch (log groups/alarms), ECS/EKS basics.

Explicitly OUT of v1: GCP/Azure support (architecture should stay pluggable so
this is addable later — do not hardcode AWS assumptions into core interfaces),
AWS Billing/Cost Explorer/Cost Center permissions (document as a callout/gotcha
instead — "read-all" does not grant billing visibility), policy
size/count-limit consolidation solving (v1 should *report* against the 6,144
managed-policy char limit and 20/25 policies-per-role limit, not auto-fix it).

## Autonomy boundaries

**Do without asking:** write code, tests, docs within locked v1 scope; work
issues on the GitHub Project board marked "Ready"; open PRs against issues;
routine refactors.

**Log to DECISIONS.md and wait for explicit sign-off before proceeding:**
anything that changes scope (new resource types, new cloud providers, new
features beyond this doc), anything that spends money (domain, Worker/KV
costs, any paid API), anything that ships/announces publicly, any change to
the monetization model or pricing.

## Business model (see LEAN_CANVAS.md for the full picture)

Open-core: free local CLI (the trust-builder, especially for regulated-industry
users). Paid: hosted mapping-DB live-update API (x402/USDC, low-sensitivity —
no customer code involved), hosted dashboard/audits (Stripe/USD — this is
where corporate buyers actually pay). Budget cap: $150/year, self-funding
required, tracked in `ledger/`.

## Where this problem came from

Real, ongoing pain at the user's day job (Charter): a three-tier AWS IAM role
structure (dev/engineer/admin) that was scoped too narrow, missing permissions
discovered piecemeal over 3+ months via AWS console red banners and failed
pipeline cleanups. This tool is the thing that would have caught that before
it happened.
