import type { FieldEvidence, NormalizedRecord, SourceDefinition } from './types';

interface Candidate {
  selector: string;
  attribute?: string;
}

interface FieldPlan {
  field: keyof NormalizedRecord;
  label: string;
  required: boolean;
  candidates: Candidate[];
  jsonKeys?: string[];
  many?: boolean;
}

const common: FieldPlan[] = [
  {
    field: 'title', label: 'Title', required: true,
    candidates: [
      { selector: 'meta[property="og:title"]', attribute: 'content' },
      { selector: 'meta[name="twitter:title"]', attribute: 'content' },
      { selector: 'h1' },
      { selector: 'title' },
    ],
    jsonKeys: ['name', 'headline'],
  },
  {
    field: 'image', label: 'Cover image', required: false,
    candidates: [
      { selector: 'meta[property="og:image"]', attribute: 'content' },
      { selector: 'meta[name="twitter:image"]', attribute: 'content' },
    ],
    jsonKeys: ['image'],
  },
  {
    field: 'description', label: 'Description', required: false,
    candidates: [
      { selector: 'meta[property="og:description"]', attribute: 'content' },
      { selector: 'meta[name="description"]', attribute: 'content' },
    ],
    jsonKeys: ['description'],
  },
];

const plans: Record<SourceDefinition['id'], FieldPlan[]> = {
  boardgamegeek: [
    common[0],
    {
      field: 'year', label: 'Published year', required: false,
      candidates: [
        { selector: '[itemprop="datePublished"]', attribute: 'content' },
        { selector: '.game-year' },
        { selector: 'meta[property="og:article:published_time"]', attribute: 'content' },
      ],
      jsonKeys: ['datePublished'],
    },
    {
      field: 'creators', label: 'Designers', required: false, many: true,
      candidates: [
        { selector: '[itemprop="author"]' },
        { selector: 'a[href*="/boardgamedesigner/"]' },
      ],
      jsonKeys: ['author', 'creator'],
    },
    common[1], common[2],
  ],
  discogs: [
    common[0],
    {
      field: 'year', label: 'Release year', required: false,
      candidates: [
        { selector: '[itemprop="datePublished"]' },
        { selector: 'time[datetime]', attribute: 'datetime' },
        { selector: 'a[href*="/year/"]' },
      ],
      jsonKeys: ['datePublished'],
    },
    {
      field: 'creators', label: 'Artists', required: false, many: true,
      candidates: [
        { selector: '[itemprop="byArtist"]' },
        { selector: 'h1 a[href*="/artist/"]' },
        { selector: 'a[href*="/artist/"]' },
      ],
      jsonKeys: ['byArtist', 'author'],
    },
    common[1], common[2],
  ],
  generic: common,
};

function clean(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function readCandidate(document: Document, candidate: Candidate, many = false): string | string[] | null {
  const nodes = [...document.querySelectorAll(candidate.selector)];
  if (!nodes.length) return null;
  const values = nodes
    .map((node) => clean(candidate.attribute ? node.getAttribute(candidate.attribute) ?? '' : node.textContent ?? ''))
    .filter(Boolean);
  if (!values.length) return null;
  return many ? [...new Set(values)].slice(0, 12) : values[0];
}

function flattenJsonLd(value: unknown, output: Record<string, unknown>[]): void {
  if (Array.isArray(value)) {
    value.forEach((item) => flattenJsonLd(item, output));
  } else if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    output.push(record);
    if ('@graph' in record) flattenJsonLd(record['@graph'], output);
  }
}

function jsonLdRecords(document: Document): Record<string, unknown>[] {
  const records: Record<string, unknown>[] = [];
  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      flattenJsonLd(JSON.parse(script.textContent ?? ''), records);
    } catch {
      // Invalid publisher JSON-LD is ignored, then visible/meta selectors are tried.
    }
  }
  return records;
}

function valueFromJson(records: Record<string, unknown>[], keys: string[], many = false): string | string[] | null {
  const values: string[] = [];
  for (const record of records) {
    for (const key of keys) {
      const raw = record[key];
      const items = Array.isArray(raw) ? raw : [raw];
      for (const item of items) {
        if (typeof item === 'string') values.push(clean(item));
        else if (item && typeof item === 'object' && typeof (item as Record<string, unknown>).name === 'string') {
          values.push(clean(String((item as Record<string, unknown>).name)));
        }
      }
    }
  }
  const unique = [...new Set(values.filter(Boolean))];
  if (!unique.length) return null;
  return many ? unique.slice(0, 12) : unique[0];
}

function yearOnly(value: string | string[] | null): string | string[] | null {
  if (typeof value !== 'string') return value;
  const match = value.match(/(?:18|19|20)\d{2}/);
  return match ? match[0] : value;
}

export function parseHtml(html: string, source: SourceDefinition, sourceUrl: string, sourceId: string | null, inspectedAt = new Date().toISOString()): { fields: FieldEvidence[]; record: NormalizedRecord } {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const jsonRecords = jsonLdRecords(document);
  const record: NormalizedRecord = {
    title: null,
    subtitle: null,
    year: null,
    creators: [],
    image: null,
    description: null,
    source: source.name,
    sourceUrl,
    sourceId,
    inspectedAt,
  };

  const fields = plans[source.id].map<FieldEvidence>((plan) => {
    let value: string | string[] | null = null;
    let selector: string | null = null;

    if (plan.jsonKeys) {
      value = valueFromJson(jsonRecords, plan.jsonKeys, plan.many);
      if (value) selector = `JSON-LD: ${plan.jsonKeys.join(' | ')}`;
    }

    if (!value || (Array.isArray(value) && !value.length)) {
      for (const candidate of plan.candidates) {
        value = readCandidate(document, candidate, plan.many);
        if (value && (!Array.isArray(value) || value.length)) {
          selector = `${candidate.selector}${candidate.attribute ? `[${candidate.attribute}]` : ''}`;
          break;
        }
      }
    }

    if (plan.field === 'year') value = yearOnly(value);
    if (plan.field === 'image' && typeof value === 'string') {
      try {
        const imageUrl = new URL(value, sourceUrl);
        value = imageUrl.protocol === 'http:' || imageUrl.protocol === 'https:' ? imageUrl.href : null;
      } catch {
        value = null;
      }
    }
    if (plan.field === 'title' && typeof value === 'string') {
      value = value.replace(/\s*[|–—-]\s*(BoardGameGeek|Discogs)\s*$/i, '').trim();
    }

    if (plan.field === 'creators') record.creators = Array.isArray(value) ? value : value ? [value] : [];
    else if (plan.field !== 'source' && plan.field !== 'sourceUrl' && plan.field !== 'sourceId' && plan.field !== 'inspectedAt') {
      record[plan.field] = typeof value === 'string' ? value : null;
    }

    return {
      field: plan.field,
      label: plan.label,
      value,
      selector,
      attempted: [
        ...(plan.jsonKeys ? [`JSON-LD: ${plan.jsonKeys.join(' | ')}`] : []),
        ...plan.candidates.map((candidate) => `${candidate.selector}${candidate.attribute ? `[${candidate.attribute}]` : ''}`),
      ],
      required: plan.required,
    };
  });

  return { fields, record };
}
