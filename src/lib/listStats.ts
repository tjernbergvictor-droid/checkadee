import type { ReferenceSpecies, UserList } from '../types';

export function visibleMainSpecies(species: ReferenceSpecies[], list: UserList): ReferenceSpecies[] {
  return species.filter((s) => {
    if (s.rank === 'subspecies') return false;
    if (!s.category || s.category === 'ABC') return true;
    return Boolean(list.includeCategoryDE);
  });
}

export function countSeen(list: UserList, speciesIds: string[]): number {
  let count = 0;
  for (const id of speciesIds) {
    if (list.observations[id]?.seen) count++;
  }
  return count;
}

export function subspeciesOf(species: ReferenceSpecies[], parentId: string): ReferenceSpecies[] {
  return species.filter((s) => s.parentId === parentId);
}
