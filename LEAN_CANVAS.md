# LEAN_CANVAS.md — iamfit

Living document. Update in place as assumptions get tested — don't just
accumulate, correct. Every line is tagged:
**[ASSUMED]** — believed true, not yet tested with a real prospective user.
**[VALIDATED]** — confirmed via real signal (a user, a conversation, usage data).

This doc is the backbone of any future investor deck. It only becomes
investor-ready once most load-bearing lines are [VALIDATED], not just written
down convincingly.

---

## Problem
- Tiered/least-privilege IAM roles in Terraform-managed AWS accounts are
  routinely under-scoped, discovered piecemeal via runtime AccessDenied
  errors, console red banners, and failed pipeline cleanups — often over
  months. **[VALIDATED — user's own 3+ month experience at Charter]**
- No existing tool statically maps Terraform source to the IAM actions it will
  require and diffs that against an existing role's policy before apply.
  **[ASSUMED — confirmed via competitive search that adjacent tools exist
  (terraform-policymaker, AirIAM, Access Analyzer, Checkov/Parliament) but none
  do exactly this; not yet confirmed by talking to other engineers whether
  they feel this pain the same way]**
- IAM policy size/count limits (6,144 char per managed policy, 20-25 policies
  per role) become a real constraint specifically when doing least-privilege
  correctly (more granular scoping = more statements). **[VALIDATED — public
  AWS documentation + real-world reports; not yet validated as a top-3 pain
  point vs. the core missing-permission problem]**

## Customer segments
- Primary: SRE/platform/DevOps engineers on teams with tiered IAM role
  structures in regulated or security-conscious orgs (fintech, healthcare,
  gov-adjacent, telecom). **[ASSUMED — matches user's own profile and
  employer; not yet validated against other companies]**
- Secondary: teams provisioning IAM for the first time in a new AWS account
  (greenfield use case). **[ASSUMED]**

## Unique value proposition
"Know what IAM permissions your Terraform code needs before you run apply —
without sending your code anywhere." **[ASSUMED — resonance not yet tested
with anyone outside this planning conversation]**

## Solution
- Free, local, open-source CLI: parses HCL, maps resources to required IAM
  actions (locked v1 list — see AGENT.md), diffs against a supplied policy or
  generates one from scratch, warns on size/count-limit risk.
- Pre-commit-hook / CI-friendly, no network call required for the core check.
- Paid hosted layer: live-updated mapping database (x402/USDC), team dashboard
  & audit reports (Stripe/USD).

## Channels
- LinkedIn build-in-public posts (user's existing habit). **[ASSUMED
  effective — not yet tested for this specific project]**
- Open-source repo / npm / Homebrew listing.
- Side-business site (benniemosher.com) as a portfolio/lead-gen tie-in.

## Revenue streams
- x402/USDC pay-per-call: mapping-database live-update API.
- Stripe/USD subscription: hosted dashboard, org-wide audits, PR-comment
  integration.
- Possible future: enterprise/air-gapped mapping-DB + support contract for
  regulated orgs. **[ASSUMED — not yet priced or tested]**

## Cost structure
- Domain: ~$12-15/yr (iamfit.dev via Cloudflare).
- Cloudflare Workers/KV: likely within free tier at MVP scale.
- Total budget cap: $150/yr self-imposed — must stay self-funding past that.

## Key metrics (to start tracking once live)
- CLI installs / downloads.
- Number of real (non-test) Terraform repos scanned.
- False-positive / false-negative reports from real usage (accuracy is the
  whole value prop — track this from day one).
- Conversion from free CLI to any paid tier.

## Unfair advantage
- User's direct, current, lived experience of this exact problem at Charter —
  not a hypothetical persona. **[VALIDATED]**
- Deep Terraform/AWS/regulated-environment background, credible source for
  this specific tool. **[VALIDATED]**
- Nothing else yet — no proprietary data, no exclusive distribution. Worth
  being honest that the resource->IAM-action mapping is the real moat, and
  it doesn't exist yet. **[ASSUMED as future advantage, not present one]**

---

## Validation plan (run in parallel with the build, not after)
1. Before or during Phase 1: show the problem statement (not even the tool
   yet) to 2-3 people who've dealt with tiered IAM roles or Terraform CI
   permissions — do they recognize this pain unprompted?
2. Once the CLI has a rough working diff for a handful of resource types: get
   at least one person outside this conversation to run it against real (or
   realistic) Terraform and react.
3. Track whether anyone would actually install/use it before building the
   paid tier — building monetization before any free-tier pull is a common
   trap worth avoiding.
4. Revisit this doc after each validation step and update ASSUMED -> VALIDATED
   or correct the assumption. Do not let this file go stale while the code
   moves fast.
