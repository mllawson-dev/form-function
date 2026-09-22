import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: "./",
  build: {
    rolldownOptions: {
      input: {
        experience: resolve(import.meta.dirname, 'index.html'),
        caseStudy: resolve(import.meta.dirname, 'case-study.html'),
      },
    },
  },
});
