# iamfit — Project Memory

This file is automatically loaded at the start of every Claude Code session.
**Read `AGENT.md` and `DECISIONS.md` immediately after this file** — they hold
the full project context, locked v1 scope, and autonomy boundaries. This file
only covers tooling/workflow conventions inherited from the Mosher Labs repo
template.

## Project Overview

iamfit statically analyzes Terraform HCL source to determine the exact AWS
IAM actions a given set of resources requires, then diffs that against an
existing role's policy or generates a least-privilege policy from scratch.
See `AGENT.md` for full scope, architecture, and business context.

**Key Details:**

- **Purpose:** Terraform-source-to-IAM-least-privilege analysis tool
- **CI/CD:** GitHub Actions with release workflow
- **Linting:** Pre-commit hooks for code quality
- **Full context:** See `AGENT.md` (project/scope/boundaries) and
  `DECISIONS.md` (decision log — append-only, strategic/spend decisions only)

## Repository Structure

```text
iamfit/
├── core/                   # HCL parser, AWS resource->IAM mapping, diff/gen engine
├── cli/                    # thin CLI wrapper, packaged for npm/homebrew
├── worker/                 # Cloudflare Worker — hosted API, x402/Stripe
├── ledger/                 # public spend ledger
├── site/                   # iamfit.dev marketing/docs
├── .github/workflows/      # CI/CD workflows
│   └── release.yml         # Semantic versioning & releases
├── .pre-commit-config.yaml
├── AGENT.md                # full project context — read first
├── DECISIONS.md            # decision log
├── LEAN_CANVAS.md           # business plan / validation tracking
├── README.md
└── CLAUDE.md                # this file
```

## Git Workflow

1. **Create feature branch:** `git checkout -b feature/description`
1. **Make changes** to code or documentation
1. **ALWAYS run pre-commit BEFORE committing:** `pre-commit run --all-files`
   - Fix ALL errors (especially markdown and YAML formatting)
   - Do NOT commit with `--no-verify` unless absolutely necessary
1. **Commit with conventional format:** `git commit -m "type: description"`
1. **Push and create PR:** `gh pr create --title "feat: description"`
1. **Test changes:** If your changes reference shared workflows that were also
   updated, temporarily change the reference from `@main` to `@your-branch`
   to test, verify the PR passes, then change back to `@main` before merging
1. **Merge to main:** Automatic release created based on commits

**Commit Format:** Conventional Commits (enforced by pre-commit hook)

- `feat:` - New feature (triggers minor version bump)
- `fix:` - Bug fix (triggers patch version bump)
- `docs:` - Documentation changes (no version bump)
- `chore:` - Maintenance (no version bump)
- `refactor:` - Code refactoring (no version bump)
- `test:` - Temporary test changes (like branch references)

**Breaking changes:** Add `!` after type (e.g., `feat!:`) or include
`BREAKING CHANGE:` in commit body for major version bump

## Pre-commit Hooks

**Installed hooks:**

- YAML linting (yamllint)
- Markdown linting (markdownlint)
- Conventional commit format
- File hygiene (trailing whitespace, EOF, etc.)

**Setup:**

```bash
pre-commit install              # One-time setup
pre-commit run --all-files      # Run manually
pre-commit autoupdate           # Update hook versions
```

## Important Notes

### Code Quality Standards

**CRITICAL:** All code must adhere to linter rules from the start. Do NOT write
code that needs fixing after running pre-commit hooks.

**Markdown (markdownlint):**

Configuration: `.markdownlint.yaml` (allows 2-space indent, 120 char lines)

- Nested lists under unordered items: Use 2-space indentation
- Nested lists under ordered items: Use 2-space indentation
- Inline format for simple nested items: `**Item:** Detail 1, Detail 2`
- Line length: 120 characters max (code/tables excluded)
- Bare URLs: Allowed in reference sections
- Bold for emphasis: Allowed in lists

**YAML (yamllint):**

- Maximum line length: 80 characters
- Use 2-space indentation
- No trailing whitespace
- Proper quoting for strings containing special characters

### When Working on This Repo

1. **Read `AGENT.md` and `DECISIONS.md` first** - full project context and
   autonomy boundaries live there, not here
1. **Write linter-compliant code from the start** - Don't fix after the fact
1. **Run pre-commit hooks** BEFORE committing (fix all errors!)
1. **Follow Conventional Commits** - Enables automatic versioning
1. **Log strategic/scope/spend decisions to `DECISIONS.md`** as PROPOSED and
   wait for sign-off — do not self-confirm these
1. **Update `LEAN_CANVAS.md`** whenever an assumption gets real validation
   signal, not just when code ships
1. **Test shared workflow changes** - Use branch references before merging

## References

- @AGENT.md - full project context, scope, and autonomy boundaries
- @DECISIONS.md - decision log
- @LEAN_CANVAS.md - business plan and validation tracking
- @README.md - Repository overview
- Shared Workflows: <https://github.com/Mosher-Labs/.github>
- Conventional Commits: <https://www.conventionalcommits.org/>

---

**Last Updated:** 2026-08-25

This file should be updated whenever project patterns change, important
context is discovered, or tooling is added/modified. Deeper project context
belongs in `AGENT.md`, not here.
