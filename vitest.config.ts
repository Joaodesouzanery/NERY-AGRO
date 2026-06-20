import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Config separada da app (vite.config.ts usa o wrapper da Lovable, que não
// aceita a chave `test`). O ambiente padrão é `node`; testes que precisam de DOM
// podem declarar `// @vitest-environment jsdom` no topo do arquivo.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
