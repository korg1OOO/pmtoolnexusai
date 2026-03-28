// vitest.config.ts
import { defineConfig } from "file:///C:/Users/Admin/bilal-project-oyeui-ag-local/kiroxysui/node_modules/vitest/dist/config.js";
import react from "file:///C:/Users/Admin/bilal-project-oyeui-ag-local/kiroxysui/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
var __vite_injected_original_dirname = "C:\\Users\\Admin\\bilal-project-oyeui-ag-local\\kiroxysui";
var vitest_config_default = defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "text", "json-summary"],
      reportsDirectory: "./coverage",
      include: ["src/services/**", "src/hooks/**", "src/utils/**", "src/components/**"],
      exclude: ["src/test/**", "**/*.test.*", "**/*.spec.*", "**/index.ts"]
    }
  },
  resolve: {
    alias: { "@": path.resolve(__vite_injected_original_dirname, "./src") }
  }
});
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXEFkbWluXFxcXGJpbGFsLXByb2plY3Qtb3lldWktYWctbG9jYWxcXFxccHJvamVjdG95ZXVpXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxBZG1pblxcXFxiaWxhbC1wcm9qZWN0LW95ZXVpLWFnLWxvY2FsXFxcXHByb2plY3RveWV1aVxcXFx2aXRlc3QuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9BZG1pbi9iaWxhbC1wcm9qZWN0LW95ZXVpLWFnLWxvY2FsL3Byb2plY3RveWV1aS92aXRlc3QuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVzdC9jb25maWdcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgcGx1Z2luczogW3JlYWN0KCldLFxyXG4gIHRlc3Q6IHtcclxuICAgIGVudmlyb25tZW50OiBcImpzZG9tXCIsXHJcbiAgICBnbG9iYWxzOiB0cnVlLFxyXG4gICAgc2V0dXBGaWxlczogW1wiLi9zcmMvdGVzdC9zZXR1cC50c1wiXSxcclxuICAgIGluY2x1ZGU6IFtcInNyYy8qKi8qLnt0ZXN0LHNwZWN9Lnt0cyx0c3h9XCJdLFxyXG4gICAgY292ZXJhZ2U6IHtcclxuICAgICAgcHJvdmlkZXI6IFwidjhcIixcclxuICAgICAgcmVwb3J0ZXI6IFtcInRleHQtc3VtbWFyeVwiLCBcInRleHRcIiwgXCJqc29uLXN1bW1hcnlcIl0sXHJcbiAgICAgIHJlcG9ydHNEaXJlY3Rvcnk6IFwiLi9jb3ZlcmFnZVwiLFxyXG4gICAgICBpbmNsdWRlOiBbXCJzcmMvc2VydmljZXMvKipcIiwgXCJzcmMvaG9va3MvKipcIiwgXCJzcmMvdXRpbHMvKipcIiwgXCJzcmMvY29tcG9uZW50cy8qKlwiXSxcclxuICAgICAgZXhjbHVkZTogW1wic3JjL3Rlc3QvKipcIiwgXCIqKi8qLnRlc3QuKlwiLCBcIioqLyouc3BlYy4qXCIsIFwiKiovaW5kZXgudHNcIl0sXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHsgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIikgfSxcclxuICB9LFxyXG59KTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF3VyxTQUFTLG9CQUFvQjtBQUNyWSxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBRmpCLElBQU0sbUNBQW1DO0FBSXpDLElBQU8sd0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixNQUFNO0FBQUEsSUFDSixhQUFhO0FBQUEsSUFDYixTQUFTO0FBQUEsSUFDVCxZQUFZLENBQUMscUJBQXFCO0FBQUEsSUFDbEMsU0FBUyxDQUFDLCtCQUErQjtBQUFBLElBQ3pDLFVBQVU7QUFBQSxNQUNSLFVBQVU7QUFBQSxNQUNWLFVBQVUsQ0FBQyxnQkFBZ0IsUUFBUSxjQUFjO0FBQUEsTUFDakQsa0JBQWtCO0FBQUEsTUFDbEIsU0FBUyxDQUFDLG1CQUFtQixnQkFBZ0IsZ0JBQWdCLG1CQUFtQjtBQUFBLE1BQ2hGLFNBQVMsQ0FBQyxlQUFlLGVBQWUsZUFBZSxhQUFhO0FBQUEsSUFDdEU7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPLEVBQUUsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTyxFQUFFO0FBQUEsRUFDakQ7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
