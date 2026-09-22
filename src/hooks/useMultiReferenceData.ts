import { useEffect, useState } from 'react';
import { loadReferenceList } from '../data/referenceData';
import type { ReferenceListFile, SourceListId } from '../types';

export function useMultiReferenceData(sources: SourceListId[]) {
  const key = sources.join('|');
  const [data, setData] = useState<Partial<Record<SourceListId, ReferenceListFile>>>({});

  useEffect(() => {
    for (const source of sources) {
      loadReferenceList(source).then((res) => {
        setData((prev) => (prev[source] ? prev : { ...prev, [source]: res }));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return data;
}
