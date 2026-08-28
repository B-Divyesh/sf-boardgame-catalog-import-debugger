import { afterEach, describe, expect, it } from 'vitest';
import {
  DIRECT_REQUEST_COOLDOWN_MS,
  directRequestCooldown,
  reserveDirectRequest,
  resetDirectRequestCooldowns,
  sourceRequestKey,
} from '../../src/rate-limit';
import { SOURCES } from '../../src/sources';

afterEach(resetDirectRequestCooldowns);

describe('direct request cooldown', () => {
  it('reserves one 15-second request budget across aliases of a known source', () => {
    const first = new URL('https://boardgamegeek.com/boardgame/7/test');
    const alias = new URL('https://www.boardgamegeek.com/boardgame/8/another');
    reserveDirectRequest(SOURCES.boardgamegeek, first, 1_000);

    expect(directRequestCooldown(SOURCES.boardgamegeek, alias, 1_000)).toBe(DIRECT_REQUEST_COOLDOWN_MS);
    expect(directRequestCooldown(SOURCES.boardgamegeek, alias, 16_000)).toBe(0);
  });

  it('keeps generic sites isolated by hostname', () => {
    const one = new URL('https://catalog.example/item/1');
    const two = new URL('https://other.example/item/1');
    reserveDirectRequest(SOURCES.generic, one, 1_000);

    expect(sourceRequestKey(SOURCES.generic, one)).not.toBe(sourceRequestKey(SOURCES.generic, two));
    expect(directRequestCooldown(SOURCES.generic, two, 1_000)).toBe(0);
  });
});
