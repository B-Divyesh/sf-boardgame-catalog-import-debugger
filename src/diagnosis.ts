import type { DiagnosisKind, FieldEvidence, RequestEvidence } from './types';

interface Diagnosis {
  kind: DiagnosisKind;
  title: string;
  detail: string;
  nextSteps: string[];
}

export function diagnose(request: RequestEvidence, fields: FieldEvidence[], isOnline = true): Diagnosis {
  if (!isOnline && request.mode === 'direct') {
    return {
      kind: 'offline',
      title: 'This device is offline',
      detail: 'No request left this browser. Your URL is still here, so reconnect and try again.',
      nextSteps: ['Reconnect to the internet.', 'Choose “Inspect URL” again.'],
    };
  }

  if (request.status === 401 || request.status === 403 || request.status === 429) {
    return {
      kind: 'blocked',
      title: request.status === 429 ? 'The source is rate-limiting requests' : 'The source refused this request',
      detail: `The page answered with HTTP ${request.status}. Meeple Import Doctor does not bypass access controls.`,
      nextSteps: ['Wait before retrying if you made several requests.', 'Open the page normally and paste its HTML source for a local-only inspection.', 'Check the source terms before changing your catalog scraper.'],
    };
  }

  if (request.status === 404 || request.status === 410) {
    return {
      kind: 'invalid-url',
      title: 'The item page was not found',
      detail: `The source answered with HTTP ${request.status}; the item may have moved or the URL may be incomplete.`,
      nextSteps: ['Open the URL in a new tab.', 'Find the canonical item page and inspect that URL.'],
    };
  }

  if (request.status === null && request.mode === 'direct') {
    return {
      kind: 'blocked',
      title: 'The browser could not read the response',
      detail: 'This is usually a cross-origin (CORS) restriction, a network block, or a privacy extension—not proof that the item is missing.',
      nextSteps: ['Open the source page in a new tab.', 'Use “Paste page HTML instead” and inspect locally.', 'Compare your catalog container logs for the same URL.'],
    };
  }

  if (request.status !== null && (request.status < 200 || request.status >= 300)) {
    return {
      kind: 'request-failed',
      title: `The source returned HTTP ${request.status}`,
      detail: request.statusText || 'The request completed, but the source did not return a usable page.',
      nextSteps: ['Open the URL directly to confirm it works.', 'Retry later if the source is temporarily unavailable.'],
    };
  }

  const detectedTitle = fields.find((field) => field.field === 'title')?.value;
  if (typeof detectedTitle === 'string' && /access denied|verify (you are|that you're) human|captcha|just a moment|security check|request blocked/i.test(detectedTitle)) {
    return {
      kind: 'blocked',
      title: 'The source returned an access check',
      detail: `The response said “${detectedTitle}” instead of returning the item. A successful HTTP status can still contain a block page.`,
      nextSteps: ['Do not try to bypass the access check.', 'Open the item normally and paste its page HTML if the source permits it.', 'Use the manual record path or retry your catalog later.'],
    };
  }

  const requiredMissing = fields.filter((field) => field.required && !field.value);
  const optionalMissing = fields.filter((field) => !field.required && (!field.value || (Array.isArray(field.value) && !field.value.length)));

  if (requiredMissing.length) {
    return {
      kind: 'changed-markup',
      title: 'The page loaded, but its markup no longer matches',
      detail: `The required ${requiredMissing.map((field) => field.label.toLowerCase()).join(', ')} selector returned nothing. The source may have changed its page structure or returned an interstitial.`,
      nextSteps: ['Review the attempted selectors below.', 'Check whether the page source contains the item title.', 'Update the matching parser in your catalog, or use the manual JSON record.'],
    };
  }

  if (optionalMissing.length) {
    return {
      kind: 'missing-field',
      title: `Importable, with ${optionalMissing.length} missing ${optionalMissing.length === 1 ? 'field' : 'fields'}`,
      detail: `The title was detected, but ${optionalMissing.map((field) => field.label.toLowerCase()).join(', ')} could not be mapped.`,
      nextSteps: ['Copy the manual JSON and fill the missing values.', 'Review failed selectors before changing your catalog parser.'],
    };
  }

  return {
    kind: 'healthy',
    title: 'The page looks importable',
    detail: 'All known fields were detected and normalized. Compare the preview before copying the record.',
    nextSteps: ['Copy the manual JSON record or retry this URL in your catalog.'],
  };
}
