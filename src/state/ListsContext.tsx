import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { loadUserLists, saveUserLists } from '../storage/db';
import type { Observation, Sighting, SourceListId, UserList } from '../types';

function uid() {
  return crypto.randomUUID();
}

interface ListsContextValue {
  lists: UserList[];
  loading: boolean;
  createList: (input: { name: string; color: string; source: SourceListId; includeCategoryDE?: boolean }) => UserList;
  deleteList: (id: string) => void;
  updateListMeta: (id: string, patch: Partial<Pick<UserList, 'name' | 'color' | 'includeCategoryDE'>>) => void;
  getList: (id: string) => UserList | undefined;
  toggleSeen: (listId: string, speciesId: string) => void;
  setSightings: (listId: string, speciesId: string, sightings: Sighting[], seen?: boolean) => void;
  replaceAllLists: (lists: UserList[]) => void;
  lastActivity: (list: UserList) => string | null;
}

const ListsContext = createContext<ListsContextValue | null>(null);

export function ListsProvider({ children }: { children: ReactNode }) {
  const [lists, setLists] = useState<UserList[]>([]);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoaded = useRef(false);

  useEffect(() => {
    loadUserLists().then((stored) => {
      setLists(stored ?? []);
      setLoading(false);
      hasLoaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (!hasLoaded.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveUserLists(lists);
    }, 250);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [lists]);

  const createList: ListsContextValue['createList'] = useCallback(({ name, color, source, includeCategoryDE }) => {
    const newList: UserList = {
      id: uid(),
      name,
      color,
      source,
      includeCategoryDE,
      createdAt: new Date().toISOString(),
      observations: {},
    };
    setLists((prev) => [...prev, newList]);
    return newList;
  }, []);

  const deleteList = useCallback((id: string) => {
    setLists((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const updateListMeta: ListsContextValue['updateListMeta'] = useCallback((id, patch) => {
    setLists((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }, []);

  const getList = useCallback((id: string) => lists.find((l) => l.id === id), [lists]);

  const toggleSeen = useCallback((listId: string, speciesId: string) => {
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== listId) return l;
        const existing = l.observations[speciesId];
        const nextSeen = !(existing?.seen ?? false);
        const observation: Observation = existing
          ? { ...existing, seen: nextSeen }
          : { speciesId, seen: nextSeen, sightings: [] };
        return { ...l, observations: { ...l.observations, [speciesId]: observation } };
      }),
    );
  }, []);

  const setSightings = useCallback((listId: string, speciesId: string, sightings: Sighting[], seen?: boolean) => {
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== listId) return l;
        const resolvedSeen = seen ?? sightings.length > 0;
        const observation: Observation = { speciesId, seen: resolvedSeen, sightings };
        return { ...l, observations: { ...l.observations, [speciesId]: observation } };
      }),
    );
  }, []);

  const replaceAllLists = useCallback((next: UserList[]) => {
    setLists(next);
  }, []);

  const lastActivity = useCallback((list: UserList) => {
    const dates = Object.values(list.observations)
      .flatMap((o) => o.sightings.map((s) => s.date))
      .filter((d): d is string => Boolean(d));
    if (dates.length === 0) return null;
    return dates.sort().at(-1) ?? null;
  }, []);

  const value = useMemo(
    () => ({
      lists,
      loading,
      createList,
      deleteList,
      updateListMeta,
      getList,
      toggleSeen,
      setSightings,
      replaceAllLists,
      lastActivity,
    }),
    [lists, loading, createList, deleteList, updateListMeta, getList, toggleSeen, setSightings, replaceAllLists, lastActivity],
  );

  return <ListsContext.Provider value={value}>{children}</ListsContext.Provider>;
}

export function useLists() {
  const ctx = useContext(ListsContext);
  if (!ctx) throw new Error('useLists must be used within ListsProvider');
  return ctx;
}
