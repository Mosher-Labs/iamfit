import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "@cdktf/hcl2json";

export interface TerraformResource {
  type: string;
  name: string;
  arguments: Record<string, unknown>;
  sourceFile: string;
}

export class HclParseError extends Error {
  constructor(
    public readonly sourceFile: string,
    cause: string,
  ) {
    super(`Failed to parse ${sourceFile}: ${cause}`);
    this.name = "HclParseError";
  }
}

/**
 * Known v1 limitations (see AGENT.md / issue #2):
 * - Non-recursive: only *.tf files directly in `dirPath` are read, no
 *   nested module directories.
 * - No support for `count`, `for_each`, `dynamic` blocks, or `module`
 *   blocks -- each `resource` block yields exactly one TerraformResource.
 * - No variable interpolation: argument values are returned as hcl2json
 *   produced them (e.g. `"${var.foo}"` stays a literal string).
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
