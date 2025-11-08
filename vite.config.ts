import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/glsl.ts'),
      name: 'glsl-script',
      fileName: (format) => `glsl-script.${format}.js`,
    },
  },
});
