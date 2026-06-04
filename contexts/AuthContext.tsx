import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { autoGuestOnLaunch, previewUiOnLaunch } from '@/lib/dev';
import { getAccountMode, canSaveToCloud, type AccountMode } from '@/lib/account-status';
import { signInAsGuestUser } from '@/lib/guest-auth';
import { registerForPushNotifications } from '@/lib/notifications';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  configured: boolean;
  accountMode: AccountMode;
  /** True when groups, profile, and admin actions can persist. */
  canSave: boolean;
  /** True when skipping login to build UI (no real Supabase user). */
  buildMode: boolean;
  enterBuildMode: () => void;
  exitBuildMode: () => void;
  signInAsGuest: () => Promise<User>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [buildMode, setBuildMode] = useState(previewUiOnLaunch);

  const buildModeActive = buildMode && !session;
  const user = session?.user ?? null;
  const accountMode = getAccountMode(user, buildModeActive);
  const canSave = canSaveToCloud(accountMode);

  const refreshProfile = async () => {
    try {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (!u) {
        setProfile(null);
        return;
      }
      const { data, error } = await supabase.from('profiles').select('*').eq('id', u.id).single();
      if (error) {
        setProfile(null);
        return;
      }
      setProfile(data as Profile | null);
    } catch {
      setProfile(null);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function bootstrap() {
      const { data: { session: existing } } = await supabase.auth.getSession();
      if (cancelled) return;

      if (existing) {
        setSession(existing);
        setBuildMode(false);
        setLoading(false);
        return;
      }

      if (previewUiOnLaunch) {
        setBuildMode(true);
        setLoading(false);
        return;
      }

      if (autoGuestOnLaunch) {
        try {
          await signInAsGuestUser();
          const { data: { session: guestSession } } = await supabase.auth.getSession();
          if (!cancelled && guestSession) {
            setSession(guestSession);
            setBuildMode(false);
          }
        } catch {
          // Anonymous off — user chooses on login screen
        }
      }

      if (!cancelled) setLoading(false);
    }

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) setBuildMode(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session?.user) {
      refreshProfile().then(() => {
        registerForPushNotifications().catch(() => {});
      });
    } else {
      setProfile(null);
    }
  }, [session?.user?.id]);

  const signOut = async () => {
    setBuildMode(false);
    await supabase.auth.signOut();
    setProfile(null);
  };

  const enterBuildMode = () => setBuildMode(true);
  const exitBuildMode = () => setBuildMode(false);

  const signInAsGuest = async () => {
    setBuildMode(false);
    const guest = await signInAsGuestUser();
    const { data: { session: s } } = await supabase.auth.getSession();
    if (s) setSession(s);
    await refreshProfile();
    return guest;
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        configured: isSupabaseConfigured,
        accountMode,
        canSave,
        buildMode: buildModeActive,
        enterBuildMode,
        exitBuildMode,
        signInAsGuest,
        refreshProfile,
        signOut,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
