export type SourceListId = 'sverige' | 'vp' | 'avilist';

export type SverigeCategory = 'ABC' | 'D' | 'E';

export interface ReferenceSpecies {
  id: string;
  rank?: 'species' | 'subspecies';
  scientificName: string;
  nameSv?: string;
  nameEn: string;
  order: string;
  orderSv?: string;
  family: string;
  familySv?: string;
  familyEn?: string;
  category?: SverigeCategory;
  parentId?: string;
  iucn?: string;
  extinct?: string;
  introduced?: boolean;
}

export interface ReferenceListFile {
  id: SourceListId;
  species: ReferenceSpecies[];
}

export interface Sighting {
  id: string;
  date?: string;
  location?: string;
  notes?: string;
}

export interface Observation {
  speciesId: string;
  seen: boolean;
  sightings: Sighting[];
}

export const LIST_COLORS = [
  'var(--color-list-gold)',
  'var(--color-list-teal)',
  'var(--color-list-rust)',
  'var(--color-list-olive)',
  'var(--color-list-plum)',
  'var(--color-list-sky)',
] as const;

export interface UserList {
  id: string;
  name: string;
  color: string;
  source: SourceListId;
  includeCategoryDE?: boolean;
  manualTotal?: number;
  createdAt: string;
  observations: Record<string, Observation>;
}

export type Language = 'sv' | 'en';
