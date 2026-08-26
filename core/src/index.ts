/**
 * @packageDocumentation
 * Public API of `@iamfit/core`: HCL ingestion ({@link extractResources}),
 * the Terraform-resource-to-IAM-action mapping ({@link RESOURCE_IAM_ACTIONS}),
 * and the policy diff engine ({@link diffPolicy}).
 */
export { diffPolicy, type IamPolicyDocument, type IamStatement } from "./diff";
export { extractResources, HclParseError, type TerraformResource } from "./ingest";
export { RESOURCE_IAM_ACTIONS } from "./mapping";
