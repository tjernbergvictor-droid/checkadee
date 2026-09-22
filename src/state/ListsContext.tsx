import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { loadUserLists, saveUserLists } from '../storage/db';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import type { Observation, Sighting, SourceListId, UserList } from '../types';

function uid() {
  return crypto.randomUUID();
}

export type SyncStatus = 'off' | 'syncing' | 'synced' | 'error';

interface ListsContextValue {
  lists: UserList[];
  loading: boolean;
  syncStatus: SyncStatus;
  createList: (input: { name: string; color: string; source: SourceListId; includeCategoryDE?: boolean }) => UserList;
  deleteList: (id: string) => void;
  updateListMeta: (id: string, patch: Partial<Pick<UserList, 'name' | 'color' | 'includeCategoryDE' | 'manualTotal'>>) => void;
  getList: (id: string) => UserList | undefined;
  toggleSeen: (listId: string, speciesId: string) => void;
  setSightings: (listId: string, speciesId: string, sightings: Sighting[], seen?: boolean) => void;
  replaceAllLists: (lists: UserList[]) => void;
  lastActivity: (list: UserList) => string | null;
}

const ListsContext = createContext<ListsContextValue | null>(null);

export function ListsProvider({ children }: { children: ReactNode }) {
  const { enabled: syncEnabled, session } = useAuth();
  const [lists, setLists] = useState<UserList[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('off');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoaded = useRef(false);
  const skipNextPush = useRef(false);
  const userId = session?.user.id ?? null;

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

  useEffect(() => {
    if (!syncEnabled || !supabase || !userId || !hasLoaded.current) return;
    let cancelled = false;
    setSyncStatus('syncing');
    supabase
      .from('user_lists')
      .select('data')
      .eq('user_id', userId)
      .maybeSingle()
      .then(async ({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setSyncStatus('error');
          return;
        }
        if (data) {
          skipNextPush.current = true;
          setLists(data.data as UserList[]);
        } else {
          await supabase!.from('user_lists').upsert({ user_id: userId, data: lists, updated_at: new Date().toISOString() });
        }
        setSyncStatus('synced');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncEnabled, userId]);

  useEffect(() => {
    if (!syncEnabled || !supabase || !userId || !hasLoaded.current) return;
    if (skipNextPush.current) {
      skipNextPush.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setSyncStatus('syncing');
      supabase!
        .from('user_lists')
        .upsert({ user_id: userId, data: lists, updated_at: new Date().toISOString() })
        .then(({ error }) => setSyncStatus(error ? 'error' : 'synced'));
    }, 600);
    return () => clearTimeout(timer);
  }, [lists, syncEnabled, userId]);

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
      syncStatus,
      createList,
      deleteList,
      updateListMeta,
      getList,
      toggleSeen,
      setSightings,
      replaceAllLists,
      lastActivity,
    }),
    [lists, loading, syncStatus, createList, deleteList, updateListMeta, getList, toggleSeen, setSightings, replaceAllLists, lastActivity],
  );

  return <ListsContext.Provider value={value}>{children}</ListsContext.Provider>;
}

export function useLists() {
  const ctx = useContext(ListsContext);
  if (!ctx) throw new Error('useLists must be used within ListsProvider');
  return ctx;
}
