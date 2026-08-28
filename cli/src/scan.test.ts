import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runScan } from "./scan";

const coreFixturesDir = join(__dirname, "..", "..", "core", "fixtures");
const coreFixturesInvalidDir = join(__dirname, "..", "..", "core", "fixtures-invalid");
const incompletePolicyPath = join(__dirname, "..", "fixtures", "incomplete-policy.json");
const completePolicyPath = join(__dirname, "..", "fixtures", "complete-policy.json");
const malformedPolicyPath = join(__dirname, "..", "fixtures", "malformed-policy.json");

describe("runScan", () => {
  it("reports missing actions and exits non-zero against an incomplete policy", async () => {
    const result = await runScan([coreFixturesDir, "--policy", incompletePolicyPath]);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("Missing IAM actions:");
    expect(result.stdout).toContain("ec2:CreateTags");
    expect(result.stdout).toContain("ec2:ModifyInstanceAttribute");
    expect(result.stdout).toContain("s3:PutBucketPolicy");
    expect(result.stdout).toContain("s3:PutBucketTagging");
    expect(result.stderr).toBe("");
  });

  it("reports no missing actions and exits zero against a fully-covering policy", async () => {
    const result = await runScan([coreFixturesDir, "--policy", completePolicyPath]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("No missing IAM actions");
    expect(result.stderr).toBe("");
  });

  it("exits non-zero with a clean usage message when <dir> is missing", async () => {
    const result = await runScan(["--policy", incompletePolicyPath]);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("missing required <dir>");
  });

  it("exits non-zero with a clean usage message when --policy is missing", async () => {
    const result = await runScan([coreFixturesDir]);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("missing required --policy");
  });

  it("exits non-zero with a clean message for a directory that doesn't exist", async () => {
    const result = await runScan(["/no/such/directory", "--policy", incompletePolicyPath]);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("iamfit scan:");
    expect(result.stderr).not.toContain("at ");
  });

  it("exits non-zero with a clean message for malformed HCL", async () => {
    const result = await runScan([coreFixturesInvalidDir, "--policy", incompletePolicyPath]);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("broken.tf");
    expect(result.stderr).not.toContain("at ");
  });

  it("exits non-zero with a clean message for a missing --policy file", async () => {
    const result = await runScan([coreFixturesDir, "--policy", "/no/such/policy.json"]);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain('failed to read policy file "/no/such/policy.json"');
  });

  it("exits non-zero with a clean message for a malformed --policy file", async () => {
    const result = await runScan([coreFixturesDir, "--policy", malformedPolicyPath]);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain(`failed to read policy file "${malformedPolicyPath}"`);
  });
});
