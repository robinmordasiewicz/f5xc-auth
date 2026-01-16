import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",

    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],

      exclude: [
        "node_modules/",
        "dist/",
        "**/*.test.ts",
        "**/__tests__/**",
        "**/tests/**",
        "**/*.config.ts",
        "**/*.d.ts",
      ],

      // Coverage thresholds (will fail if not met)
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85,

        // Per-file thresholds for critical modules
        "src/auth/credential-manager.ts": {
          lines: 90,
          functions: 90,
          branches: 83,
        },
        "src/auth/http-client.ts": {
          lines: 90,
          functions: 90,
          branches: 85,
        },
        "src/profile/manager.ts": {
          lines: 90,
          functions: 90,
          branches: 85,
        },
      },

      // Include only source code
      include: ["src/**/*.ts"],

      // Report uncovered files
      all: true,
    },

    // Test timeout (10 seconds for UAT)
    testTimeout: 10000,

    // Hook timeout (5 seconds)
    hookTimeout: 5000,
  },
});
