/// <reference types='vitest' />
import * as path from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/libs/analytics',

  plugins: [
    dts({
      entryRoot: 'src',
      tsconfigPath: path.join(__dirname, 'tsconfig.lib.json'),
    }),
  ],

  build: {
    outDir: '../../dist/libs/analytics',
    emptyOutDir: true,
    minify: 'esbuild',
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      entry: 'src/index.ts',
      name: 'analytics',
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
  },

  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8' as const,
      reporter: ['text', 'json', 'html'] as const,
      reportsDirectory: '../../coverage/libs/analytics',
    },
  },
})
