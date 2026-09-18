import type { Language, ReferenceSpecies } from '../types';

export function displayName(species: ReferenceSpecies, language: Language): { primary: string; secondary: string } {
  const sv = species.nameSv?.trim();
  const en = species.nameEn?.trim();
  const primary = language === 'sv' ? sv || en || species.scientificName : en || sv || species.scientificName;
  const otherName = language === 'sv' ? en : sv;
  const secondary = otherName && otherName !== primary ? `${species.scientificName} · ${otherName}` : species.scientificName;
  return { primary, secondary };
}
