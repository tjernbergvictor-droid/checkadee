import type { ReferenceSpecies } from '../types';

export interface FamilyGroup {
  family: string;
  familySv?: string;
  familyEn?: string;
  species: ReferenceSpecies[];
}

export interface OrderGroup {
  order: string;
  orderSv?: string;
  families: FamilyGroup[];
}

export function groupSpecies(species: ReferenceSpecies[]): OrderGroup[] {
  const groups: OrderGroup[] = [];
  for (const s of species) {
    let orderGroup = groups.at(-1);
    if (!orderGroup || orderGroup.order !== s.order) {
      orderGroup = { order: s.order, orderSv: s.orderSv, families: [] };
      groups.push(orderGroup);
    }
    let familyGroup = orderGroup.families.at(-1);
    if (!familyGroup || familyGroup.family !== s.family) {
      familyGroup = { family: s.family, familySv: s.familySv, familyEn: s.familyEn, species: [] };
      orderGroup.families.push(familyGroup);
    }
    familyGroup.species.push(s);
  }
  return groups;
}
