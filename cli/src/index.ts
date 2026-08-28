#!/usr/bin/env node
import { runScan } from "./scan";

/**
 * The `iamfit` executable's entry point. Dispatches to a subcommand based
 * on `process.argv`, writes its result to stdout/stderr, and sets the
 * process exit code accordingly.
 */
async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);

  if (command !== "scan") {
    process.stderr.write(
      `iamfit: unknown command "${command ?? ""}"\nUsage: iamfit scan <dir> --policy <path-to-policy.json>\n`,
    );
    process.exitCode = 1;
    return;
  }

  const result = await runScan(rest);
  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
  process.exitCode = result.exitCode;
}

void main();
