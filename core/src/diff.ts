import type { TerraformResource } from "./ingest";
import { RESOURCE_IAM_ACTIONS } from "./mapping";

/** A single statement within an {@link IamPolicyDocument}. */
export interface IamStatement {
  /** Whether this statement allows or denies the actions it lists. */
  Effect: "Allow" | "Deny";
  /** One or more IAM action patterns, e.g. `"s3:GetObject"` or `"s3:*"`. */
  Action: string | string[];
  /** One or more resource ARNs (or `"*"`) the statement applies to. */
  Resource: string | string[];
}

/** A minimal AWS IAM policy document, matching the real IAM policy JSON shape. */
export interface IamPolicyDocument {
  /** The IAM policy language version, e.g. `"2012-10-17"`. */
  Version: string;
  /** The statements that make up this policy. */
  Statement: IamStatement[];
}

/**
 * Returns the IAM actions required by `resources` (per `RESOURCE_IAM_ACTIONS`)
 * that are not granted by any `Allow` statement in `policy`, accounting for
 * `*`/`?` wildcards in the policy's `Action` values (e.g. `s3:*` satisfies
 * any `s3:...` requirement).
 *
 * v1 scope: only `Allow` statements are considered -- explicit `Deny`
 * statements are not evaluated against required actions. Resource types not
 * present in `RESOURCE_IAM_ACTIONS` are silently skipped (no mapping yet,
 * not a diff failure). See DECISIONS.md for both known gaps.
 *
 * @param resources - The resources under analysis, e.g. from {@link extractResources}.
 * @param policy - The existing IAM policy to diff against.
 * @returns The missing action names, alphabetically sorted.
 */
export function diffPolicy(resources: TerraformResource[], policy: IamPolicyDocument): string[] {
  const requiredActions = new Set<string>();

  for (const resource of resources) {
    const actions = RESOURCE_IAM_ACTIONS[resource.type];
    if (!actions) {
      continue;
    }
    for (const action of actions) {
      requiredActions.add(action);
    }
  }

  const missing = [...requiredActions].filter((action) => !isActionGranted(action, policy));

  return missing.sort();
}

/**
 * Checks whether some `Allow` statement in `policy` grants `action`.
 *
 * @param action - The IAM action to check for, e.g. `"s3:CreateBucket"`.
 * @param policy - The policy to check against.
 * @returns `true` if an `Allow` statement's `Action` matches `action`.
 */
function isActionGranted(action: string, policy: IamPolicyDocument): boolean {
  return policy.Statement.some((statement) => {
    if (statement.Effect !== "Allow") {
      return false;
    }
    const patterns = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
    return patterns.some((pattern) => matchesAction(action, pattern));
  });
}

/**
 * Tests whether an IAM action matches a policy action pattern, honoring
 * IAM's `*`/`?` wildcards and case-insensitive comparison.
 *
 * @param action - The concrete action to test, e.g. `"s3:CreateBucket"`.
 * @param pattern - The policy's `Action` entry, e.g. `"s3:*"` or `"s3:CreateBucket"`.
 * @returns `true` if `pattern` matches `action`.
 */
function matchesAction(action: string, pattern: string): boolean {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  return new RegExp(`^${escaped}$`, "i").test(action);
}
