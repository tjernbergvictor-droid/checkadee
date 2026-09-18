import { get, set } from 'idb-keyval';
import type { UserList } from '../types';

const LISTS_KEY = 'checkadee.userLists';

export async function loadUserLists(): Promise<UserList[] | null> {
  const data = await get<UserList[]>(LISTS_KEY);
  return data ?? null;
}

export async function saveUserLists(lists: UserList[]): Promise<void> {
  await set(LISTS_KEY, lists);
}

export interface BackupFile {
  app: 'checkadee';
  version: 1;
  exportedAt: string;
  lists: UserList[];
}

export function exportBackup(lists: UserList[]): string {
  const backup: BackupFile = {
    app: 'checkadee',
    version: 1,
    exportedAt: new Date().toISOString(),
    lists,
  };
  return JSON.stringify(backup, null, 2);
}

export function parseBackup(text: string): UserList[] {
  const data = JSON.parse(text) as BackupFile;
  if (data.app !== 'checkadee' || !Array.isArray(data.lists)) {
    throw new Error('Invalid backup file');
  }
  return data.lists;
}
