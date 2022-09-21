import path from "path";
import { defineConfig } from "vitest/config";
import dts from 'vite-plugin-dts'

const fileName = {
  es: `trie.mjs`,
  cjs: `trie.cjs`,
};

export default defineConfig({
  plugins: [dts()],
  base: "./",
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "trie",
      formats: ["es", "cjs"],
      fileName: (format) => fileName[format],
    },
    rollupOptions: {
      output: {
        // Since we publish our ./src folder, there's no point
        // in bloating sourcemaps with another copy of it.
        sourcemapExcludeSources: true,
      },
    },
    sourcemap: true,
    // Let the consumer of the node_module set the target.
    target: 'esnext',
    minify: false,
  },
});
