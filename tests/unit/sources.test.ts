import { describe, expect, it } from 'vitest';
import { inspectUrl } from '../../src/sources';

describe('inspectUrl', () => {
  it('recognizes a BoardGameGeek item and extracts its id', () => {
    const result = inspectUrl('https://boardgamegeek.com/boardgame/174430/gloomhaven');
    expect(result.valid).toBe(true);
    expect(result.source.id).toBe('boardgamegeek');
    expect(result.sourceId).toBe('174430');
  });

  it('recognizes localized Discogs release URLs', () => {
    const result = inspectUrl('https://www.discogs.com/en/release/249504-Daft-Punk-Discovery');
    expect(result.valid).toBe(true);
    expect(result.source.id).toBe('discogs');
    expect(result.sourceId).toBe('249504');
  });

  it('rejects collection and search pages as item URLs', () => {
    const result = inspectUrl('https://boardgamegeek.com/browse/boardgame');
    expect(result.valid).toBe(false);
    expect(result.problem).toMatch(/item URL/i);
  });

  it('rejects non-web schemes', () => {
    expect(inspectUrl('file:///etc/passwd')).toMatchObject({ valid: false, sourceId: null });
  });

  it('allows an unknown public page through the generic parser', () => {
    const result = inspectUrl('https://catalog.example/items/42');
    expect(result.valid).toBe(true);
    expect(result.source.id).toBe('generic');
  });
});
