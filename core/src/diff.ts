import type { TerraformResource } from "./ingest";
import { RESOURCE_IAM_ACTIONS } from "./mapping";

export interface IamStatement {
  Effect: "Allow" | "Deny";
  Action: string | string[];
  Resource: string | string[];
}

export interface IamPolicyDocument {
  Version: string;
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
 * not a diff failure).
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

function isActionGranted(action: string, policy: IamPolicyDocument): boolean {
  return policy.Statement.some((statement) => {
    if (statement.Effect !== "Allow") {
      return false;
    }
    const patterns = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
    return patterns.some((pattern) => matchesAction(action, pattern));
  });
}

/** IAM action names/patterns are case-insensitive; `*` and `?` are wildcards. */
function matchesAction(action: string, pattern: string): boolean {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  return new RegExp(`^${escaped}$`, "i").test(action);
}
