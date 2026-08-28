import type { SourceDefinition } from './types';

export const DIRECT_REQUEST_COOLDOWN_MS = 15_000;

const recentDirectRequests = new Map<string, number>();

export function sourceRequestKey(source: SourceDefinition, url: URL): string {
  // Known sources share one budget across their aliases; unknown pages are
  // limited by host so unrelated sites never affect one another.
  return source.id === 'generic' ? `host:${url.hostname.toLowerCase()}` : `source:${source.id}`;
}

export function directRequestCooldown(source: SourceDefinition, url: URL, now = Date.now()): number {
  const lastRequest = recentDirectRequests.get(sourceRequestKey(source, url));
  if (lastRequest === undefined) return 0;
  return Math.max(0, DIRECT_REQUEST_COOLDOWN_MS - (now - lastRequest));
}

export function reserveDirectRequest(source: SourceDefinition, url: URL, now = Date.now()): void {
  recentDirectRequests.set(sourceRequestKey(source, url), now);
}

// Kept explicit for deterministic unit coverage; app code never clears the policy.
export function resetDirectRequestCooldowns(): void {
  recentDirectRequests.clear();
}
