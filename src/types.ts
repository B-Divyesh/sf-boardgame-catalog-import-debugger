export type SourceId = 'boardgamegeek' | 'discogs' | 'generic';

export type DiagnosisKind =
  | 'healthy'
  | 'blocked'
  | 'missing-field'
  | 'changed-markup'
  | 'invalid-url'
  | 'offline'
  | 'request-failed';

export interface SourceDefinition {
  id: SourceId;
  name: string;
  host: string;
  attributionUrl: string;
  itemTypes: string[];
}

export interface RequestEvidence {
  mode: 'direct' | 'pasted' | 'sample';
  status: number | null;
  statusText: string;
  elapsedMs: number;
  contentType: string;
  bytes: number;
  finalUrl: string;
  fetchedAt: string;
}

export interface FieldEvidence {
  field: keyof NormalizedRecord;
  label: string;
  value: string | string[] | null;
  selector: string | null;
  attempted: string[];
  required: boolean;
}

export interface NormalizedRecord {
  title: string | null;
  subtitle: string | null;
  year: string | null;
  creators: string[];
  image: string | null;
  description: string | null;
  source: string;
  sourceUrl: string;
  sourceId: string | null;
  inspectedAt: string;
}

export interface InspectionResult {
  source: SourceDefinition;
  request: RequestEvidence;
  fields: FieldEvidence[];
  record: NormalizedRecord;
  diagnosis: DiagnosisKind;
  diagnosisTitle: string;
  diagnosisDetail: string;
  nextSteps: string[];
}
