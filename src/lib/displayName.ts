import type { Language, ReferenceSpecies } from '../types';

export function capitalizeFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function displayName(species: ReferenceSpecies, language: Language): { primary: string; secondary: string } {
  const sv = species.nameSv?.trim();
  const svCapitalized = sv ? capitalizeFirst(sv) : sv;
  const en = species.nameEn?.trim();
  const primary = language === 'sv' ? svCapitalized || en || species.scientificName : en || svCapitalized || species.scientificName;
  const otherName = language === 'sv' ? en : svCapitalized;
  const secondary = otherName && otherName !== primary ? `${species.scientificName} · ${otherName}` : species.scientificName;
  return { primary, secondary };
}
