import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { extractResources, HclParseError } from "./ingest";

const fixturesDir = join(__dirname, "..", "fixtures");

describe("extractResources", () => {
  it("returns exactly 2 resources with correct type/name/arguments", async () => {
    const resources = await extractResources(fixturesDir);

    expect(resources).toHaveLength(2);

    const s3Bucket = resources.find((r) => r.type === "aws_s3_bucket");
    expect(s3Bucket).toEqual({
      type: "aws_s3_bucket",
      name: "reports",
      arguments: {
        bucket: "iamfit-example-reports",
        tags: {
          Environment: "dev",
          Team: "platform",
        },
      },
      sourceFile: "s3-bucket.tf",
    });

    const ec2Instance = resources.find((r) => r.type === "aws_instance");
    expect(ec2Instance).toEqual({
      type: "aws_instance",
      name: "web",
      arguments: {
        ami: "ami-0abcdef1234567890",
        instance_type: "t3.micro",
        tags: {
          Name: "web",
        },
      },
      sourceFile: "ec2-instance.tf",
    });
  });

  it("ignores non-resource top-level blocks", async () => {
    // non-resource-blocks.tf declares a variable, provider, data source,
    // locals, and output but no `resource` block -- if these leaked through,
    // the count below would exceed 2.
    const resources = await extractResources(fixturesDir);

    expect(resources).toHaveLength(2);
    expect(resources.some((r) => r.sourceFile === "non-resource-blocks.tf")).toBe(false);

    for (const resource of resources) {
      expect(resource.type).not.toBe("variable");
      expect(resource.type).not.toBe("output");
      expect(resource.type).not.toBe("provider");
      expect(resource.type).not.toBe("data");
      expect(resource.type).not.toBe("locals");
    }
  });

  it("surfaces HCL syntax errors with the offending file name", async () => {
    const invalidDir = join(__dirname, "..", "fixtures-invalid");

    await expect(extractResources(invalidDir)).rejects.toThrow(HclParseError);
    await expect(extractResources(invalidDir)).rejects.toThrow(/broken\.tf/);
  });
});
