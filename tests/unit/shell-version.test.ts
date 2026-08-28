import { describe, expect, it } from 'vitest';
import { shellCacheVersion } from '../../build/shell-version';

const bytes = (value: string) => new TextEncoder().encode(value);

describe('service-worker shell version', () => {
  it('is stable when manifest order changes', () => {
    const first = [
      { url: '/', content: bytes('home') },
      { url: '/assets/main.js', content: bytes('app') },
    ];

    expect(shellCacheVersion(first)).toBe(shellCacheVersion([...first].reverse()));
  });

  it('changes when a same-named shell file changes', () => {
    const original = [{ url: '/', content: bytes('old home') }];
    const updated = [{ url: '/', content: bytes('new home') }];

    expect(shellCacheVersion(updated)).not.toBe(shellCacheVersion(original));
  });
});
