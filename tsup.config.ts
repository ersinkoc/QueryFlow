import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/plugins/index.ts',
    'src/bindings/react/index.ts',
    'src/bindings/vue/index.ts',
    'src/bindings/svelte/index.ts',
    'src/bindings/solid/index.ts',
  ],
  format: ['cjs', 'esm'],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  external: ['react', 'react-dom', 'vue', 'svelte', 'svelte/store', 'solid-js'],
});
