import { createHash } from 'node:crypto';

export interface ShellEntry {
  url: string;
  content: Uint8Array;
}

export function shellCacheVersion(entries: readonly ShellEntry[]): string {
  const hash = createHash('sha256');
  for (const entry of [...entries].sort((left, right) => left.url.localeCompare(right.url))) {
    hash.update(entry.url);
    hash.update('\0');
    hash.update(entry.content);
    hash.update('\0');
  }
  return hash.digest('hex').slice(0, 12);
}
