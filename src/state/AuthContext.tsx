import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

interface AuthContextValue {
  enabled: boolean;
  session: Session | null;
  authLoading: boolean;
  displayName: string | null;
  signInWithEmail: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  setDisplayName: (name: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      enabled: isSupabaseConfigured,
      session,
      authLoading,
      displayName: (session?.user.user_metadata?.display_name as string | undefined) ?? null,
      async signInWithEmail(email: string) {
        if (!supabase) return { error: 'not-configured' };
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin },
        });
        return error ? { error: error.message } : {};
      },
      async signOut() {
        if (!supabase) return;
        await supabase.auth.signOut();
      },
      async setDisplayName(name: string) {
        if (!supabase) return { error: 'not-configured' };
        const { error } = await supabase.auth.updateUser({ data: { display_name: name } });
        if (!error) {
          const { data } = await supabase.auth.getSession();
          setSession(data.session);
        }
        return error ? { error: error.message } : {};
      },
    }),
    [session, authLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
