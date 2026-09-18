import { useEffect, useState } from 'react';
import { loadReferenceList } from '../data/referenceData';
import type { ReferenceListFile, SourceListId } from '../types';

export function useReferenceList(source: SourceListId) {
  const [data, setData] = useState<ReferenceListFile | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    loadReferenceList(source)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      });
    return () => {
      cancelled = true;
    };
  }, [source]);

  return { data, loading: !data && !error, error };
}
