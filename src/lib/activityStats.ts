import type { ReferenceListFile, ReferenceSpecies, SourceListId, UserList } from '../types';

export interface ActivityEntry {
  list: UserList;
  species: ReferenceSpecies;
  date: string;
  location?: string;
}

export function getDatedTicks(lists: UserList[], refData: Partial<Record<SourceListId, ReferenceListFile>>): ActivityEntry[] {
  const entries: ActivityEntry[] = [];
  for (const list of lists) {
    const data = refData[list.source];
    if (!data) continue;
    const byId = new Map(data.species.map((s) => [s.id, s]));
    for (const obs of Object.values(list.observations)) {
      if (!obs.seen) continue;
      const dated = obs.sightings.filter((s): s is typeof s & { date: string } => Boolean(s.date)).sort((a, b) => (a.date < b.date ? -1 : 1));
      if (dated.length === 0) continue;
      const first = dated[0];
      const species = byId.get(obs.speciesId);
      if (!species) continue;
      entries.push({ list, species, date: first.date, location: first.location });
    }
  }
  return entries;
}

export function yearCounts(entries: ActivityEntry[]): { year: number; count: number }[] {
  const counts = new Map<number, number>();
  for (const e of entries) {
    const year = Number(e.date.slice(0, 4));
    counts.set(year, (counts.get(year) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => a[0] - b[0]).map(([year, count]) => ({ year, count }));
}

export function sameMonthPastYears(entries: ActivityEntry[], referenceDate = new Date()): ActivityEntry[] {
  const month = referenceDate.getMonth() + 1;
  const year = referenceDate.getFullYear();
  return entries
    .filter((e) => Number(e.date.slice(5, 7)) === month && Number(e.date.slice(0, 4)) !== year)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}
