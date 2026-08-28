import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import type { Plugin } from 'vite';
import type { OutputBundle, OutputOptions } from 'rollup';

const serviceWorkerTemplate = resolve(__dirname, 'public/sw.js');

function writeShellServiceWorker(): Plugin {
  return {
    name: 'meeple-doctor-shell-service-worker',
    apply: 'build',
    async writeBundle(outputOptions: OutputOptions, bundle: OutputBundle) {
      const assets = Object.values(bundle)
        .filter((entry) => entry.type === 'chunk' || (entry.type === 'asset' && entry.fileName.endsWith('.css')))
        .map((entry) => `/${entry.fileName}`)
        .sort();
      const cacheName = `meeple-doctor-shell-${createHash('sha256').update(assets.join('\n')).digest('hex').slice(0, 12)}`;
      const template = await readFile(serviceWorkerTemplate, 'utf8');
      const worker = template
        .replace('__CACHE_NAME__', cacheName)
        .replace('__PRECACHE_ASSETS__', JSON.stringify(assets));
      await writeFile(resolve(outputOptions.dir ?? resolve(__dirname, 'dist'), 'sw.js'), worker);
    },
  };
}

export default defineConfig({
  plugins: [writeShellServiceWorker()],
  build: {
    target: 'es2022',
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        privacy: resolve(__dirname, 'privacy/index.html'),
        terms: resolve(__dirname, 'terms/index.html'),
      },
    },
  },
});
