import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    passWithNoTests: true,
    include: ["{core,cli,worker}/src/**/*.{test,spec}.ts"],
  },
});
