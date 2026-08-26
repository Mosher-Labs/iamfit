import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "@cdktf/hcl2json";

/**
 * A single Terraform `resource` block, normalized from parsed HCL into a
 * flat shape the mapping/diff engine can consume directly.
 */
export interface TerraformResource {
  /** The resource type, e.g. `"aws_s3_bucket"`. */
  type: string;
  /** The resource's local Terraform label, e.g. `"reports"` given `resource "aws_s3_bucket" "reports" { ... }`. */
  name: string;
  /** The resource block's arguments, keyed by argument name, as produced by hcl2json. */
  arguments: Record<string, unknown>;
  /** The base file name (not full path) the resource was declared in. */
  sourceFile: string;
}

/**
 * Thrown by {@link extractResources} when a `.tf` file fails to parse as
 * valid HCL. Carries the offending file name so callers don't have to
 * re-derive it from the underlying parser error message.
 */
export class HclParseError extends Error {
  /**
   * @param sourceFile - The base name of the file that failed to parse.
   * @param cause - The underlying HCL parser error message.
   */
  constructor(
    public readonly sourceFile: string,
    cause: string,
  ) {
    super(`Failed to parse ${sourceFile}: ${cause}`);
    this.name = "HclParseError";
  }
}

/**
 * Reads every `.tf` file directly inside `dirPath`, parses each with
 * `@cdktf/hcl2json`, and flattens all `resource` blocks across those files
 * into a single, file-name-sorted `TerraformResource[]`. Non-resource
 * top-level blocks (`variable`, `output`, `provider`, `data`, `locals`) are
 * ignored.
 *
 * Known v1 limitations (see AGENT.md / issue #2):
 * - Non-recursive: only `.tf` files directly in `dirPath` are read, no
 *   nested module directories.
 * - No support for `count`, `for_each`, `dynamic` blocks, or `module`
 *   blocks -- each `resource` block yields exactly one TerraformResource.
 * - No variable interpolation: argument values are returned as hcl2json
 *   produced them (e.g. `"${var.foo}"` stays a literal string).
 * - No duplicate-address detection: a `type`/`name` pair repeated across
 *   files yields one TerraformResource per occurrence. Valid Terraform
 *   config can't actually contain this (duplicate resource addresses are
 *   a Terraform parse error), so this isn't guarded against here.
 *
 * @param dirPath - Directory containing the `.tf` files to read.
 * @returns All resource blocks found, in file-name-sorted order.
 * @throws {@link HclParseError} If any `.tf` file fails to parse.
 */
export async function extractResources(dirPath: string): Promise<TerraformResource[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const tfFileNames = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".tf"))
    .map((entry) => entry.name)
    .sort();

  const resources: TerraformResource[] = [];

  for (const fileName of tfFileNames) {
    const filePath = join(dirPath, fileName);
    const contents = await readFile(filePath, "utf-8");

    let parsed: Record<string, unknown>;
    try {
      parsed = await parse(fileName, contents);
    } catch (error) {
      const cause = error instanceof Error ? error.message : String(error);
      throw new HclParseError(fileName, cause);
    }

    resources.push(...extractResourcesFromParsedFile(parsed, fileName));
  }

  return resources;
}

/**
 * Extracts the `resource` blocks from a single hcl2json-parsed file.
 *
 * @param parsed - The hcl2json output for one `.tf` file.
 * @param sourceFile - The base file name, stamped onto each resulting {@link TerraformResource}.
 * @returns The resources declared in `parsed`, or an empty array if the file has no top-level `resource` block.
 */
function extractResourcesFromParsedFile(
  parsed: Record<string, unknown>,
  sourceFile: string,
): TerraformResource[] {
  const resourceBlocks = parsed.resource;
  if (!isRecord(resourceBlocks)) {
    return [];
  }

  const resources: TerraformResource[] = [];

  for (const [type, namedResources] of Object.entries(resourceBlocks)) {
    if (!isRecord(namedResources)) {
      continue;
    }

    for (const [name, config] of Object.entries(namedResources)) {
      // hcl2json represents each `resource "type" "name" { ... }` block as
      // a single-element array containing the argument object.
      const args = Array.isArray(config) ? config[0] : config;
      resources.push({
        type,
        name,
        arguments: isRecord(args) ? args : {},
        sourceFile,
      });
    }
  }

  return resources;
}

/**
 * Narrows `value` to a plain object, excluding arrays and `null`.
 *
 * @param value - The value to test.
 * @returns `true` if `value` is a non-null, non-array object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
