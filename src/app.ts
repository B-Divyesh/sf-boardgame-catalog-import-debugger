import './style.css';
import { diagnose } from './diagnosis';
import { parseHtml } from './parser';
import { inspectUrl, type UrlCheck } from './sources';
import type { DiagnosisKind, FieldEvidence, InspectionResult, RequestEvidence } from './types';

const form = document.querySelector<HTMLFormElement>('#inspect-form')!;
const urlInput = document.querySelector<HTMLInputElement>('#item-url')!;
const htmlInput = document.querySelector<HTMLTextAreaElement>('#page-html')!;
const sourceBadge = document.querySelector<HTMLElement>('#source-badge')!;
const urlError = document.querySelector<HTMLElement>('#url-error')!;
const inspectButton = document.querySelector<HTMLButtonElement>('#inspect-button')!;
const sampleButton = document.querySelector<HTMLButtonElement>('#sample-button')!;
const loading = document.querySelector<HTMLElement>('#loading')!;
const report = document.querySelector<HTMLElement>('#report')!;
const recentList = document.querySelector<HTMLElement>('#recent-list')!;
const clearRecentButton = document.querySelector<HTMLButtonElement>('#clear-recent')!;
const undoBar = document.querySelector<HTMLElement>('#undo-bar')!;
const undoClearButton = document.querySelector<HTMLButtonElement>('#undo-clear')!;
const globalStatus = document.querySelector<HTMLElement>('#global-status')!;

const RECENT_KEY = 'meeple-doctor:recent:v1';
const REQUEST_TIMEOUT_MS = 12_000;
let undoSnapshot: RecentInspection[] | null = null;
let undoTimer: number | null = null;

interface RecentInspection {
  url: string;
  source: string;
  diagnosis: DiagnosisKind;
  title: string;
  at: string;
}

const SAMPLE_HTML = `<!doctype html><html><head>
  <title>Lantern Keepers | BoardGameGeek</title>
  <meta property="og:title" content="Lantern Keepers | BoardGameGeek">
  <meta property="og:image" content="https://example.invalid/lantern-keepers.webp">
  <script type="application/ld+json">{"@type":"Game","name":"Lantern Keepers","datePublished":"2024","author":[{"name":"Mara Bell"}]}</script>
</head><body><main><h1>Lantern Keepers</h1><p>The publisher removed the old description metadata.</p></main></body></html>`;

function setLoading(active: boolean, detail = 'Requesting one public page.'): void {
  loading.hidden = !active;
  inspectButton.disabled = active;
  inspectButton.querySelector('span')!.textContent = active ? 'Inspecting…' : 'Inspect URL';
  document.querySelector<HTMLElement>('#loading-detail')!.textContent = detail;
  if (active) {
    report.hidden = true;
    urlError.textContent = '';
  }
}

function updateSourceBadge(): void {
  const check = inspectUrl(urlInput.value);
  if (!urlInput.value.trim()) {
    sourceBadge.textContent = 'Waiting for a URL';
    sourceBadge.dataset.state = 'waiting';
  } else if (!check.valid) {
    sourceBadge.textContent = check.source.id === 'generic' ? 'Check URL' : check.source.name;
    sourceBadge.dataset.state = 'warning';
  } else {
    sourceBadge.textContent = check.source.id === 'generic' ? 'Generic metadata' : `${check.source.name} parser`;
    sourceBadge.dataset.state = 'ready';
  }
}

function createElement<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function icon(kind: 'check' | 'warning' | 'error' | 'dot'): SVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  svg.setAttribute('viewBox', '0 0 18 18');
  svg.setAttribute('aria-hidden', 'true');
  if (kind === 'check') {
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', 'm4 9.2 3.1 3.1L14 5.8');
    svg.append(path);
  } else if (kind === 'warning') {
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', 'M9 2.3 16 15H2L9 2.3Z M9 6.5v4 M9 13v.1');
    svg.append(path);
  } else if (kind === 'error') {
    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', '9'); circle.setAttribute('cy', '9'); circle.setAttribute('r', '7');
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', 'm6.5 6.5 5 5m0-5-5 5');
    svg.append(circle, path);
  } else {
    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', '9'); circle.setAttribute('cy', '9'); circle.setAttribute('r', '3');
    svg.append(circle);
  }
  return svg;
}

function diagnosisTone(kind: DiagnosisKind): 'check' | 'warning' | 'error' {
  if (kind === 'healthy') return 'check';
  if (kind === 'missing-field') return 'warning';
  return 'error';
}

function labelForMode(mode: RequestEvidence['mode']): string {
  return mode === 'pasted' ? 'Pasted HTML · local only' : mode === 'sample' ? 'Built-in sample · no request' : 'Direct browser request';
}

function appendDefinition(list: HTMLDListElement, term: string, value: string): void {
  list.append(createElement('dt', '', term), createElement('dd', '', value));
}

function fieldStatus(field: FieldEvidence): HTMLElement {
  const found = Boolean(field.value && (!Array.isArray(field.value) || field.value.length));
  const row = createElement('li', `field-row ${found ? 'field-found' : 'field-missing'}`);
  const head = createElement('div', 'field-head');
  const titleWrap = createElement('div', 'field-title');
  titleWrap.append(icon(found ? 'check' : 'error'), createElement('strong', '', field.label));
  head.append(titleWrap, createElement('span', 'status-word', found ? 'Detected' : field.required ? 'Required · missing' : 'Missing'));
  row.append(head);
  if (found) {
    row.append(createElement('p', 'field-value', Array.isArray(field.value) ? field.value.join(', ') : String(field.value)));
  }
  const details = createElement('details', 'selector-details');
  const summary = createElement('summary', '', found ? 'Show matched selector' : `Show ${field.attempted.length} attempted selectors`);
  const codeList = createElement('ul', 'selector-list');
  for (const selector of field.attempted) {
    const item = createElement('li');
    const code = createElement('code', '', selector);
    if (selector === field.selector) code.append(createElement('span', 'matched-label', ' matched'));
    item.append(code);
    codeList.append(item);
  }
  details.append(summary, codeList);
  row.append(details);
  return row;
}

function renderReport(result: InspectionResult, store = true): void {
  report.replaceChildren();
  const tone = diagnosisTone(result.diagnosis);
  const summary = createElement('div', `diagnosis diagnosis-${tone}`);
  const marker = createElement('div', 'diagnosis-marker');
  marker.append(icon(tone));
  const summaryCopy = createElement('div', 'diagnosis-copy');
  summaryCopy.append(createElement('p', 'eyebrow', 'Diagnosis'), createElement('h2', '', result.diagnosisTitle), createElement('p', '', result.diagnosisDetail));
  const sourceLink = createElement('a', 'source-link', `Source: ${result.source.name} ↗`);
  sourceLink.href = result.source.attributionUrl || result.record.sourceUrl;
  sourceLink.target = '_blank';
  sourceLink.rel = 'noreferrer';
  summaryCopy.append(sourceLink);
  summary.append(marker, summaryCopy);
  summary.querySelector('h2')!.id = 'report-title';
  report.append(summary);

  const trace = createElement('div', 'trace');
  const requestSection = createElement('section', 'trace-step');
  const requestHeading = createElement('div', 'trace-heading');
  requestHeading.append(createElement('span', 'trace-number', '01'), createElement('div', '', ''));
  requestHeading.lastElementChild!.append(createElement('p', 'trace-label', 'Request'), createElement('h3', '', labelForMode(result.request.mode)));
  const requestData = createElement('dl', 'evidence-grid');
  appendDefinition(requestData, 'HTTP status', result.request.status === null ? 'No readable response' : `${result.request.status} ${result.request.statusText}`.trim());
  appendDefinition(requestData, 'Elapsed', `${result.request.elapsedMs} ms`);
  appendDefinition(requestData, 'Content', result.request.contentType || 'Unknown');
  appendDefinition(requestData, 'Page size', result.request.bytes ? `${Math.ceil(result.request.bytes / 1024)} KB` : 'Not available');
  requestSection.append(requestHeading, requestData);

  const fieldSection = createElement('section', 'trace-step');
  const fieldHeading = createElement('div', 'trace-heading');
  fieldHeading.append(createElement('span', 'trace-number', '02'), createElement('div', '', ''));
  const foundCount = result.fields.filter((field) => field.value && (!Array.isArray(field.value) || field.value.length)).length;
  fieldHeading.lastElementChild!.append(createElement('p', 'trace-label', 'Field map'), createElement('h3', '', `${foundCount} of ${result.fields.length} known fields detected`));
  const fieldList = createElement('ul', 'field-list');
  result.fields.forEach((field) => fieldList.append(fieldStatus(field)));
  fieldSection.append(fieldHeading, fieldList);

  const recoverySection = createElement('section', 'trace-step');
  const recoveryHeading = createElement('div', 'trace-heading');
  recoveryHeading.append(createElement('span', 'trace-number', '03'), createElement('div', '', ''));
  recoveryHeading.lastElementChild!.append(createElement('p', 'trace-label', 'Recovery'), createElement('h3', '', 'A normalized manual record'));
  const recoveryGrid = createElement('div', 'recovery-grid');
  const preview = createElement('div', 'record-preview');
  preview.append(createElement('p', 'mini-label', 'Normalized preview'), createElement('h4', '', result.record.title || 'Untitled item'));
  const metaParts = [result.record.year, result.record.creators.join(', ')].filter(Boolean);
  if (metaParts.length) preview.append(createElement('p', 'preview-meta', metaParts.join(' · ')));
  preview.append(createElement('p', 'preview-description', result.record.description || 'No description was detected.'));
  const provenance = createElement('p', 'preview-source', `Attributed to ${result.record.source} · ${result.record.sourceId ? `ID ${result.record.sourceId}` : 'no source ID detected'}`);
  preview.append(provenance);
  const sourceUrl = createElement('a', '', 'Open original page ↗');
  sourceUrl.href = result.record.sourceUrl;
  sourceUrl.target = '_blank'; sourceUrl.rel = 'noreferrer';
  preview.append(sourceUrl);

  const exportBox = createElement('div', 'export-box');
  const exportTop = createElement('div', 'export-top');
  exportTop.append(createElement('p', 'mini-label', 'Manual import JSON'));
  const copyButton = createElement('button', 'button secondary', 'Copy JSON');
  copyButton.type = 'button';
  const json = JSON.stringify(result.record, null, 2);
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(json);
      copyButton.textContent = 'Copied';
      globalStatus.textContent = 'Manual import JSON copied to clipboard.';
      window.setTimeout(() => { copyButton.textContent = 'Copy JSON'; }, 1800);
    } catch {
      globalStatus.textContent = 'Clipboard access was blocked. Select the JSON text and copy it manually.';
      pre.focus();
      window.getSelection()?.selectAllChildren(pre);
    }
  });
  exportTop.append(copyButton);
  const pre = createElement('pre');
  pre.tabIndex = 0;
  const code = createElement('code', '', json);
  pre.append(code);
  exportBox.append(exportTop, pre);
  recoveryGrid.append(preview, exportBox);

  const next = createElement('div', 'next-steps');
  next.append(createElement('h4', '', 'What to do next'));
  const nextList = createElement('ol');
  result.nextSteps.forEach((step) => nextList.append(createElement('li', '', step)));
  next.append(nextList);
  recoverySection.append(recoveryHeading, recoveryGrid, next);
  trace.append(requestSection, fieldSection, recoverySection);
  report.append(trace);
  report.hidden = false;
  report.focus({ preventScroll: true });
  report.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });

  if (store) saveRecent(result);
}

function invalidResult(check: UrlCheck): void {
  urlInput.setAttribute('aria-invalid', 'true');
  urlError.textContent = check.problem ?? 'Check this URL and try again.';
  urlInput.focus();
}

async function inspect(check: UrlCheck, html: string): Promise<void> {
  if (!check.url) return;
  const started = performance.now();
  const pasted = html.trim().length > 0;
  setLoading(true, pasted ? 'Parsing the pasted source on this device.' : `Requesting one page from ${check.source.name}.`);

  let request: RequestEvidence;
  let pageHtml = html.trim();
  if (pasted) {
    request = {
      mode: 'pasted', status: 200, statusText: 'HTML provided', elapsedMs: Math.round(performance.now() - started),
      contentType: 'text/html · local', bytes: new Blob([pageHtml]).size, finalUrl: check.url.href, fetchedAt: new Date().toISOString(),
    };
  } else {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(check.url.href, {
        method: 'GET', redirect: 'follow', credentials: 'omit', cache: 'no-store', signal: controller.signal,
        headers: { Accept: 'text/html,application/xhtml+xml' },
      });
      pageHtml = await response.text();
      request = {
        mode: 'direct', status: response.status, statusText: response.statusText, elapsedMs: Math.round(performance.now() - started),
        contentType: response.headers.get('content-type') ?? '', bytes: new Blob([pageHtml]).size,
        finalUrl: response.url || check.url.href, fetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      request = {
        mode: 'direct', status: null, statusText: error instanceof DOMException && error.name === 'AbortError' ? 'Timed out after 12 seconds' : 'Browser could not expose the response',
        elapsedMs: Math.round(performance.now() - started), contentType: '', bytes: 0, finalUrl: check.url.href, fetchedAt: new Date().toISOString(),
      };
    } finally {
      window.clearTimeout(timeout);
    }
  }

  const parsed = parseHtml(pageHtml, check.source, check.url.href, check.sourceId, request.fetchedAt);
  const outcome = diagnose(request, parsed.fields, navigator.onLine);
  const result: InspectionResult = {
    source: check.source, request, fields: parsed.fields, record: parsed.record,
    diagnosis: outcome.kind, diagnosisTitle: outcome.title, diagnosisDetail: outcome.detail, nextSteps: outcome.nextSteps,
  };
  setLoading(false);
  renderReport(result);
}

function loadRecent(): RecentInspection[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(value) ? value.slice(0, 5) as RecentInspection[] : [];
  } catch { return []; }
}

function setRecent(items: RecentInspection[]): void {
  localStorage.setItem(RECENT_KEY, JSON.stringify(items.slice(0, 5)));
  renderRecent();
}

function saveRecent(result: InspectionResult): void {
  const item: RecentInspection = {
    url: result.record.sourceUrl, source: result.source.name, diagnosis: result.diagnosis,
    title: result.record.title || result.diagnosisTitle, at: new Date().toISOString(),
  };
  setRecent([item, ...loadRecent().filter((entry) => entry.url !== item.url)]);
}

function renderRecent(): void {
  const items = loadRecent();
  recentList.replaceChildren();
  clearRecentButton.hidden = items.length === 0;
  if (!items.length) {
    recentList.className = 'empty-recent';
    recentList.append(createElement('p', '', 'No recent inspections.'), createElement('span', '', 'Your last five URLs will appear here on this device.'));
    return;
  }
  recentList.className = 'recent-list';
  const list = createElement('ul');
  for (const item of items) {
    const li = createElement('li');
    const button = createElement('button', 'recent-item');
    button.type = 'button';
    const main = createElement('span', 'recent-main');
    main.append(createElement('strong', '', item.title), createElement('span', '', `${item.source} · ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.at))}`));
    const state = createElement('span', `recent-state state-${diagnosisTone(item.diagnosis)}`, item.diagnosis.replace('-', ' '));
    button.append(main, state);
    button.addEventListener('click', () => {
      urlInput.value = item.url;
      htmlInput.value = '';
      updateSourceBadge();
      urlInput.focus();
      globalStatus.textContent = 'Recent URL loaded. Choose Inspect URL to run it again.';
    });
    li.append(button); list.append(li);
  }
  recentList.append(list);
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  urlInput.removeAttribute('aria-invalid');
  urlError.textContent = '';
  const check = inspectUrl(urlInput.value);
  if (!check.valid) return invalidResult(check);
  void inspect(check, htmlInput.value);
});

urlInput.addEventListener('input', updateSourceBadge);
urlInput.addEventListener('paste', () => window.setTimeout(updateSourceBadge));

sampleButton.addEventListener('click', () => {
  urlInput.value = 'https://boardgamegeek.com/boardgame/424242/lantern-keepers';
  htmlInput.value = SAMPLE_HTML;
  document.querySelector<HTMLDetailsElement>('#paste-panel')!.open = true;
  updateSourceBadge();
  void inspect(inspectUrl(urlInput.value), SAMPLE_HTML).then(() => {
    globalStatus.textContent = 'Sample diagnosis loaded. It uses built-in HTML and makes no network request.';
  });
});

clearRecentButton.addEventListener('click', () => {
  undoSnapshot = loadRecent();
  setRecent([]);
  undoBar.hidden = false;
  undoClearButton.focus();
  if (undoTimer) window.clearTimeout(undoTimer);
  undoTimer = window.setTimeout(() => { undoBar.hidden = true; undoSnapshot = null; }, 7000);
});

undoClearButton.addEventListener('click', () => {
  if (undoSnapshot) setRecent(undoSnapshot);
  undoSnapshot = null;
  undoBar.hidden = true;
  clearRecentButton.focus();
  globalStatus.textContent = 'Recent inspections restored.';
});

window.addEventListener('offline', () => { globalStatus.textContent = 'You are offline. Pasted HTML can still be inspected locally.'; });
window.addEventListener('online', () => { globalStatus.textContent = 'You are back online.'; });

updateSourceBadge();
renderRecent();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => { void navigator.serviceWorker.register('/sw.js'); });
}
