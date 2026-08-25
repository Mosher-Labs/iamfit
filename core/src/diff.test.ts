import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { diffPolicy, type IamPolicyDocument } from "./diff";
import { extractResources, type TerraformResource } from "./ingest";

const fixturesDir = join(__dirname, "..", "fixtures");

describe("diffPolicy", () => {
  it("reports the specific missing actions for the ingest fixtures against an incomplete policy", async () => {
    const resources = await extractResources(fixturesDir);

    const incompletePolicy: IamPolicyDocument = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: ["s3:CreateBucket", "ec2:RunInstances"],
          Resource: "*",
        },
      ],
    };

    const missing = diffPolicy(resources, incompletePolicy);

    expect(missing).toEqual(
      [
        "ec2:CreateTags",
        "ec2:ModifyInstanceAttribute",
        "s3:PutBucketPolicy",
        "s3:PutBucketTagging",
      ].sort(),
    );
  });

  it("reports a policy missing one required action", () => {
    const resources: TerraformResource[] = [
      { type: "aws_iam_policy", name: "x", arguments: {}, sourceFile: "x.tf" },
    ];
    const policy: IamPolicyDocument = {
      Version: "2012-10-17",
      Statement: [{ Effect: "Allow", Action: ["iam:CreatePolicy"], Resource: "*" }],
    };

    expect(diffPolicy(resources, policy)).toEqual(["iam:TagPolicy"]);
  });

  it("reports nothing missing when a wildcard statement fully covers requirements", () => {
    const resources: TerraformResource[] = [
      { type: "aws_s3_bucket", name: "x", arguments: {}, sourceFile: "x.tf" },
    ];
    const policy: IamPolicyDocument = {
      Version: "2012-10-17",
      Statement: [{ Effect: "Allow", Action: "s3:*", Resource: "*" }],
    };

    expect(diffPolicy(resources, policy)).toEqual([]);
  });

  it("reports every required action when the policy has no relevant statements", () => {
    const resources: TerraformResource[] = [
      { type: "aws_instance", name: "x", arguments: {}, sourceFile: "x.tf" },
    ];
    const policy: IamPolicyDocument = {
      Version: "2012-10-17",
      Statement: [{ Effect: "Allow", Action: "dynamodb:GetItem", Resource: "*" }],
    };

    expect(diffPolicy(resources, policy)).toEqual(
      ["ec2:CreateTags", "ec2:ModifyInstanceAttribute", "ec2:RunInstances"].sort(),
    );
  });
});
