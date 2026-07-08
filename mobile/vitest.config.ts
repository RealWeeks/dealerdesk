import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/tests/setup.ts"],
    env: {
      RNTL_SKIP_DEPS_CHECK: "true"
    }
  },
  esbuild: {
    jsx: "automatic"
  },
  resolve: {
    alias: [
      { find: "@", replacement: new URL("./src", import.meta.url).pathname },
      { find: /^@testing-library\/react-native$/, replacement: new URL("./src/tests/rntlMock.ts", import.meta.url).pathname },
      { find: "react/jsx-dev-runtime", replacement: new URL("../node_modules/react/jsx-dev-runtime.js", import.meta.url).pathname },
      { find: "react/jsx-runtime", replacement: new URL("../node_modules/react/jsx-runtime.js", import.meta.url).pathname },
      { find: /^react-native$/, replacement: new URL("./src/tests/reactNativeMock.tsx", import.meta.url).pathname },
      { find: /^react-native\/.*$/, replacement: new URL("./src/tests/reactNativeMock.tsx", import.meta.url).pathname },
      { find: /^react$/, replacement: new URL("../node_modules/react/index.js", import.meta.url).pathname },
      { find: /^react-dom$/, replacement: new URL("../node_modules/react-dom/index.js", import.meta.url).pathname },
      { find: /^react-dom\/client$/, replacement: new URL("../node_modules/react-dom/client.js", import.meta.url).pathname }
    ]
  }
});
