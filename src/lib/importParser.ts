import type { Language, ReferenceSpecies } from '../types';

export interface ImportRow {
  rawName: string;
  date?: string;
  location?: string;
  notes?: string;
}

export interface MatchedImportRow extends ImportRow {
  species: ReferenceSpecies;
}

const NAME_HEADERS = ['art', 'species', 'namn', 'svenskt namn', 'swedish name', 'vetenskapligt namn', 'scientific name', 'name'];
const DATE_HEADERS = ['datum', 'date'];
const LOCATION_HEADERS = ['plats', 'location', 'lokal', 'place'];
const NOTES_HEADERS = ['anteckningar', 'notes', 'notering', 'kommentar', 'comment'];

function normalizeHeader(h: string) {
  return h.trim().toLowerCase();
}

function findColumn(headers: string[], candidates: string[]): number {
  const normalized = headers.map(normalizeHeader);
  for (const candidate of candidates) {
    const idx = normalized.indexOf(candidate);
    if (idx !== -1) return idx;
  }
  return -1;
}

export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  const src = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < src.length; i++) {
    const char = src[i];
    if (inQuotes) {
      if (char === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',' || char === ';') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

function normalizeDate(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const dmy = trimmed.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return undefined;
}

export function rowsToImportRows(table: string[][]): { rows: ImportRow[]; error?: string } {
  if (table.length === 0) return { rows: [], error: 'empty' };
  const [headerRow, ...dataRows] = table;
  const nameIdx = findColumn(headerRow, NAME_HEADERS);
  if (nameIdx === -1) return { rows: [], error: 'no-name-column' };
  const dateIdx = findColumn(headerRow, DATE_HEADERS);
  const locationIdx = findColumn(headerRow, LOCATION_HEADERS);
  const notesIdx = findColumn(headerRow, NOTES_HEADERS);

  const rows: ImportRow[] = [];
  for (const r of dataRows) {
    const rawName = (r[nameIdx] ?? '').trim();
    if (!rawName) continue;
    rows.push({
      rawName,
      date: dateIdx !== -1 ? normalizeDate(r[dateIdx] ?? '') : undefined,
      location: locationIdx !== -1 ? (r[locationIdx] ?? '').trim() || undefined : undefined,
      notes: notesIdx !== -1 ? (r[notesIdx] ?? '').trim() || undefined : undefined,
    });
  }
  return { rows };
}

function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function buildSpeciesIndex(species: ReferenceSpecies[]) {
  const byScientific = new Map<string, ReferenceSpecies>();
  const bySwedish = new Map<string, ReferenceSpecies>();
  const byEnglish = new Map<string, ReferenceSpecies>();
  for (const s of species) {
    byScientific.set(norm(s.scientificName), s);
    if (s.nameSv) bySwedish.set(norm(s.nameSv), s);
    byEnglish.set(norm(s.nameEn), s);
  }
  return { byScientific, bySwedish, byEnglish };
}

export function matchSpecies(rawName: string, index: ReturnType<typeof buildSpeciesIndex>): ReferenceSpecies | undefined {
  const key = norm(rawName);
  return index.byScientific.get(key) ?? index.bySwedish.get(key) ?? index.byEnglish.get(key);
}

export function generateTemplateCSV(language: Language): string {
  if (language === 'sv') {
    return [
      'Art,Datum,Plats,Anteckningar',
      'Blåmes,2026-05-12,Hornborgasjön,3 individer',
      'Sångsvan,,,',
    ].join('\n');
  }
  return [
    'Species,Date,Location,Notes',
    'Eurasian Blue Tit,2026-05-12,Hornborgasjön,3 individuals',
    'Whooper Swan,,,',
  ].join('\n');
}
