import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    retry: 2,
    testTimeout: 30_000,
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "text", "json-summary"],
      reportsDirectory: "./coverage",
      include: ["src/services/**", "src/hooks/**", "src/utils/**", "src/components/**"],
      exclude: ["src/test/**", "**/*.test.*", "**/*.spec.*", "**/index.ts"],
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
