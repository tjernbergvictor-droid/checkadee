import type { ReferenceListFile, SourceListId } from '../types';

const cache = new Map<SourceListId, Promise<ReferenceListFile>>();

export function loadReferenceList(id: SourceListId): Promise<ReferenceListFile> {
  let promise = cache.get(id);
  if (!promise) {
    promise = fetch(`${import.meta.env.BASE_URL}data/${id}.json`).then((res) => {
      if (!res.ok) throw new Error(`Failed to load reference list ${id}`);
      return res.json() as Promise<ReferenceListFile>;
    });
    cache.set(id, promise);
  }
  return promise;
}
