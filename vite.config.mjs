import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist-web',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        control: resolve(__dirname, 'control.html'),
        reminder: resolve(__dirname, 'reminder.html')
      }
    }
  }
});
