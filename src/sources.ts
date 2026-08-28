import type { SourceDefinition, SourceId } from './types';

export const SOURCES: Record<SourceId, SourceDefinition> = {
  boardgamegeek: {
    id: 'boardgamegeek',
    name: 'BoardGameGeek',
    host: 'boardgamegeek.com',
    attributionUrl: 'https://boardgamegeek.com',
    itemTypes: ['boardgame'],
  },
  discogs: {
    id: 'discogs',
    name: 'Discogs',
    host: 'discogs.com',
    attributionUrl: 'https://www.discogs.com',
    itemTypes: ['release', 'master'],
  },
  generic: {
    id: 'generic',
    name: 'Generic web page',
    host: '',
    attributionUrl: '',
    itemTypes: [],
  },
};

export interface UrlCheck {
  valid: boolean;
  url: URL | null;
  source: SourceDefinition;
  sourceId: string | null;
  problem: string | null;
}

export function inspectUrl(raw: string): UrlCheck {
  const value = raw.trim();
  if (!value) {
    return { valid: false, url: null, source: SOURCES.generic, sourceId: null, problem: 'Enter an item URL to inspect.' };
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { valid: false, url: null, source: SOURCES.generic, sourceId: null, problem: 'This is not a complete web address. Include https:// and the item page.' };
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return { valid: false, url: null, source: SOURCES.generic, sourceId: null, problem: 'Only public http:// or https:// item pages can be inspected.' };
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  const source = host === 'boardgamegeek.com' || host.endsWith('.boardgamegeek.com')
    ? SOURCES.boardgamegeek
    : host === 'discogs.com' || host.endsWith('.discogs.com')
      ? SOURCES.discogs
      : SOURCES.generic;

  if (source.id === 'boardgamegeek') {
    const match = url.pathname.match(/^\/boardgame\/(\d+)(?:\/|$)/);
    if (!match) return { valid: false, url, source, sourceId: null, problem: 'Use a BoardGameGeek item URL such as /boardgame/174430/gloomhaven.' };
    return { valid: true, url, source, sourceId: match[1], problem: null };
  }

  if (source.id === 'discogs') {
    const match = url.pathname.match(/^\/(?:[^/]+\/)?(release|master)\/(\d+)(?:-|\/|$)/i);
    if (!match) return { valid: false, url, source, sourceId: null, problem: 'Use a Discogs release or master URL, not a search, artist, or marketplace page.' };
    return { valid: true, url, source, sourceId: match[2], problem: null };
  }

  return { valid: true, url, source, sourceId: null, problem: null };
}
