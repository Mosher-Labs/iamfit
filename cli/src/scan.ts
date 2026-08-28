import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import {
  diffPolicy,
  extractResources,
  type IamPolicyDocument,
  type TerraformResource,
} from "@iamfit/core";

/** The outcome of running the `scan` command, ready for a caller to print and exit with. */
export interface ScanResult {
  /** The process exit code the caller should use: `0` for no missing actions, `1` otherwise. */
  exitCode: number;
  /** Text to write to stdout, or an empty string if nothing should be printed there. */
  stdout: string;
  /** Text to write to stderr, or an empty string if nothing should be printed there. */
  stderr: string;
}

/**
 * Implements `iamfit scan <dir> --policy <path-to-policy.json>`: extracts
 * Terraform resources from `<dir>`, diffs their required IAM actions
 * against the policy at `--policy`, and reports the result.
 *
 * All expected failure modes (bad HCL, a missing directory, a missing or
 * unparsable policy file, missing required arguments) are caught and
 * turned into a clean, one-line stderr message with `exitCode: 1` --
 * callers should never see a raw stack trace from this function.
 *
 * @param argv - The command's arguments, e.g. `process.argv.slice(3)` (after the `scan` subcommand itself).
 * @returns The result to print and exit with.
 */
export async function runScan(argv: string[]): Promise<ScanResult> {
  let dir: string | undefined;
  let policyPath: string | undefined;

  try {
    const { positionals, values } = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        policy: { type: "string" },
      },
    });
    dir = positionals[0];
    policyPath = values.policy;
  } catch (error) {
    return usageError(`invalid arguments: ${describeError(error)}`);
  }

  if (!dir) {
    return usageError("missing required <dir> argument");
  }
  if (!policyPath) {
    return usageError("missing required --policy <path-to-policy.json> argument");
  }

  let resources: TerraformResource[];
  try {
    resources = await extractResources(dir);
  } catch (error) {
    return { exitCode: 1, stdout: "", stderr: `iamfit scan: ${describeError(error)}\n` };
  }

  let policy: IamPolicyDocument;
  try {
    const raw = await readFile(policyPath, "utf-8");
    policy = JSON.parse(raw) as IamPolicyDocument;
  } catch (error) {
    return {
      exitCode: 1,
      stdout: "",
      stderr: `iamfit scan: failed to read policy file "${policyPath}": ${describeError(error)}\n`,
    };
  }

  return report(resources, policy);
}

/** Builds the final {@link ScanResult} from the diff between `resources` and `policy`. */
function report(resources: TerraformResource[], policy: IamPolicyDocument): ScanResult {
  const missing = diffPolicy(resources, policy);

  if (missing.length === 0) {
    return {
      exitCode: 0,
      stdout: "No missing IAM actions -- the supplied policy covers all scanned resources.\n",
      stderr: "",
    };
  }

  const stdout = `Missing IAM actions:\n${missing.map((action) => `  ${action}`).join("\n")}\n`;
  return { exitCode: 1, stdout, stderr: "" };
}

/** Builds a `ScanResult` for a usage/argument error, including a usage hint. */
function usageError(message: string): ScanResult {
  return {
    exitCode: 1,
    stdout: "",
    stderr: `iamfit scan: ${message}\nUsage: iamfit scan <dir> --policy <path-to-policy.json>\n`,
  };
}

/** Extracts a human-readable message from a caught value of unknown type. */
function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
