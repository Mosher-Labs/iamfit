/**
 * v1 seed: a hand-curated map from Terraform resource type to the AWS IAM
 * actions typically required to create or update that resource via the AWS
 * provider. This is NOT derived from the AWS provider source or from a
 * comprehensive audit of every code path -- it is a manually-authored
 * starting point and may have gaps. Per LEAN_CANVAS.md, mapping accuracy IS
 * the product, so treat any reported gap as a bug worth fixing, not a
 * shrug.
 *
 * Scope note: only actions needed to *create or update* the resource are
 * listed here -- read-only actions needed solely for `terraform plan`/state
 * refresh (e.g. `s3:GetBucketTagging`, `ec2:DescribeInstances`) are
 * deliberately left out, matching issue #3's "create/update" framing. Only
 * S3, IAM (role/policy), and EC2 instances are seeded here -- see AGENT.md's
 * locked v1 resource scope for the full list still to be added.
 */
export const RESOURCE_IAM_ACTIONS: Record<string, string[]> = {
  aws_s3_bucket: ["s3:CreateBucket", "s3:PutBucketTagging", "s3:PutBucketPolicy"],
  aws_iam_role: ["iam:CreateRole", "iam:TagRole", "iam:UpdateAssumeRolePolicy"],
  aws_iam_policy: ["iam:CreatePolicy", "iam:TagPolicy"],
  aws_instance: ["ec2:RunInstances", "ec2:CreateTags", "ec2:ModifyInstanceAttribute"],
};
