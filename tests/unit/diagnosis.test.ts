import { describe, expect, it } from 'vitest';
import { diagnose } from '../../src/diagnosis';
import type { FieldEvidence, RequestEvidence } from '../../src/types';

const request: RequestEvidence = {
  mode: 'direct', status: 200, statusText: 'OK', elapsedMs: 80, contentType: 'text/html', bytes: 2048,
  finalUrl: 'https://example.test/item/1', fetchedAt: '2026-08-28T00:00:00Z',
};
const title = (value: string | null): FieldEvidence => ({ field: 'title', label: 'Title', value, selector: value ? 'h1' : null, attempted: ['h1'], required: true });
const image = (value: string | null): FieldEvidence => ({ field: 'image', label: 'Cover image', value, selector: value ? 'meta[property="og:image"]' : null, attempted: ['meta[property="og:image"]'], required: false });

describe('diagnose', () => {
  it('classifies rate limiting as blocked', () => {
    expect(diagnose({ ...request, status: 429 }, [title(null)]).kind).toBe('blocked');
  });

  it('recognizes block pages even when they return HTTP 200', () => {
    expect(diagnose(request, [title('Just a moment…'), image(null)]).kind).toBe('blocked');
  });

  it('classifies a missing required selector as changed markup', () => {
    expect(diagnose(request, [title(null), image(null)]).kind).toBe('changed-markup');
  });

  it('classifies optional gaps as a missing field', () => {
    expect(diagnose(request, [title('A game'), image(null)]).kind).toBe('missing-field');
  });

  it('classifies a complete field map as healthy', () => {
    expect(diagnose(request, [title('A game'), image('cover.webp')]).kind).toBe('healthy');
  });

  it('distinguishes offline from an unreadable response', () => {
    expect(diagnose({ ...request, status: null }, [title(null)], false).kind).toBe('offline');
    expect(diagnose({ ...request, status: null }, [title(null)], true).kind).toBe('blocked');
  });
});
