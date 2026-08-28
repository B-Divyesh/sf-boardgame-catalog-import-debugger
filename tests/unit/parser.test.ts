/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { parseHtml } from '../../src/parser';
import { SOURCES } from '../../src/sources';

describe('parseHtml', () => {
  it('normalizes BoardGameGeek JSON-LD and meta fields with evidence', () => {
    const html = `<!doctype html><head>
      <meta property="og:title" content="Brass: Birmingham | BoardGameGeek">
      <meta property="og:image" content="https://images.example/brass.webp">
      <meta name="description" content="Build networks during the industrial revolution.">
      <script type="application/ld+json">{
        "@type":"Game", "name":"Brass: Birmingham", "datePublished":"2018-01-01",
        "author":[{"name":"Gavan Brown"},{"name":"Matt Tolman"}]
      }</script>
    </head><body><h1>Fallback title</h1></body>`;
    const { fields, record } = parseHtml(html, SOURCES.boardgamegeek, 'https://boardgamegeek.com/boardgame/224517/brass-birmingham', '224517', '2026-08-28T00:00:00.000Z');

    expect(record).toMatchObject({
      title: 'Brass: Birmingham', year: '2018', creators: ['Gavan Brown', 'Matt Tolman'],
      image: 'https://images.example/brass.webp', sourceId: '224517', source: 'BoardGameGeek',
    });
    expect(fields.find((field) => field.field === 'title')?.selector).toMatch(/JSON-LD/);
    expect(fields.every((field) => field.value)).toBe(true);
  });

  it('uses Discogs selectors when structured data is absent', () => {
    const html = `<!doctype html><head><meta property="og:title" content="Blue Lines - Massive Attack | Discogs"><meta name="description" content="1991 album"></head>
      <body><h1><a href="/artist/3268-Massive-Attack">Massive Attack</a></h1><time datetime="1991-04-08"></time></body>`;
    const { record } = parseHtml(html, SOURCES.discogs, 'https://www.discogs.com/release/42-blue-lines', '42');
    expect(record.title).toBe('Blue Lines - Massive Attack');
    expect(record.year).toBe('1991');
    expect(record.creators).toEqual(['Massive Attack']);
  });

  it('ignores malformed JSON-LD and reports missing selectors', () => {
    const html = '<html><head><script type="application/ld+json">{broken</script></head><body></body></html>';
    const { fields, record } = parseHtml(html, SOURCES.generic, 'https://example.test/item', null);
    expect(record.title).toBeNull();
    expect(fields.find((field) => field.field === 'title')).toMatchObject({ value: null, required: true });
  });
});
