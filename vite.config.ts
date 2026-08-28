import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import type { Plugin } from 'vite';
import type { OutputBundle, OutputOptions } from 'rollup';
import { shellCacheVersion } from './build/shell-version';

const serviceWorkerTemplate = resolve(__dirname, 'public/sw.js');
const staticShellFiles = [
  { url: '/', fileName: 'index.html' },
  { url: '/privacy/', fileName: 'privacy/index.html' },
  { url: '/terms/', fileName: 'terms/index.html' },
  { url: '/favicon.svg', fileName: 'favicon.svg' },
  { url: '/art/inspection-bench-900.webp', fileName: 'art/inspection-bench-900.webp' },
  { url: '/art/inspection-bench-1536.webp', fileName: 'art/inspection-bench-1536.webp' },
] as const;

function writeShellServiceWorker(): Plugin {
  return {
    name: 'meeple-doctor-shell-service-worker',
    apply: 'build',
    async writeBundle(outputOptions: OutputOptions, bundle: OutputBundle) {
      const generatedAssets = Object.values(bundle)
        .filter((entry) => entry.type === 'chunk' || (entry.type === 'asset' && entry.fileName.endsWith('.css')))
        .map((entry) => ({ url: `/${entry.fileName}`, fileName: entry.fileName }))
        .sort((left, right) => left.url.localeCompare(right.url));
      const outputDirectory = resolve(outputOptions.dir ?? resolve(__dirname, 'dist'));
      const shellFiles = [...staticShellFiles, ...generatedAssets];
      const shellEntries = await Promise.all(shellFiles.map(async ({ url, fileName }) => ({
        url,
        content: await readFile(resolve(outputDirectory, fileName)),
      })));
      const cacheName = `meeple-doctor-shell-${shellCacheVersion(shellEntries)}`;
      const template = await readFile(serviceWorkerTemplate, 'utf8');
      const worker = template
        .replace('__CACHE_NAME__', cacheName)
        .replace('__PRECACHE_ASSETS__', JSON.stringify(generatedAssets.map(({ url }) => url)));
      await writeFile(resolve(outputDirectory, 'sw.js'), worker);
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
