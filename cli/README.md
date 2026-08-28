# @iamfit/cli

Thin CLI wrapper around `@iamfit/core`.

## `iamfit scan`

Scans a directory of Terraform source and reports which AWS IAM actions
required by its resources are missing from a supplied IAM policy.

```bash
iamfit scan <dir> --policy <path-to-policy.json>
```

- `<dir>` -- a directory containing `.tf` files (non-recursive; see
  `@iamfit/core`'s known ingestion limitations).
- `--policy <path>` -- path to a JSON file containing an AWS IAM policy
  document (`Version` + `Statement[]`, matching the real IAM policy JSON
  shape).

**Exit codes:** `0` if the policy covers every required action, `1` if
any actions are missing or if the command fails (bad HCL, a missing
directory, a missing/unparsable policy file). This makes `iamfit scan`
usable directly as a CI or pre-commit gate.

**Example:**

```console
$ iamfit scan ./infra --policy ./infra-policy.json
Missing IAM actions:
  ec2:CreateTags
  s3:PutBucketTagging
```

## Scope

v1 covers only the resource types seeded in `@iamfit/core`'s
`RESOURCE_IAM_ACTIONS` map (S3, IAM role/policy, EC2 instances as of this
writing -- see `core/src/mapping.ts` for the current list). Policy
generation from scratch (no existing policy to diff against) is not yet
supported; see the project board for that follow-up.
