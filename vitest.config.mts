import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    passWithNoTests: true,
    include: ["{core,cli,worker}/src/**/*.{test,spec}.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["{core,cli,worker}/src/**/*.ts"],
      exclude: ["**/*.{test,spec}.ts"],
    },
  },
});
