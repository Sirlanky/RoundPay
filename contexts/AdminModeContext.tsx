import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { canUseAdminMode, countAdminGroups } from '@/lib/admin/role';
import { isVerifiedAdmin } from '@/lib/identity-verification';

export type AppMode = 'admin' | 'member';

const STORAGE_KEY = 'roundpay.app_mode';

interface AdminModeContextValue {
  mode: AppMode;
  canAdmin: boolean;
  adminGroupCount: number;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
  refreshAdminAccess: () => Promise<void>;
  loading: boolean;
}

const AdminModeContext = createContext<AdminModeContextValue | undefined>(undefined);

export function AdminModeProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [mode, setModeState] = useState<AppMode>('member');
  const [adminGroupCount, setAdminGroupCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const canAdmin = useMemo(
    () => canUseAdminMode(profile, adminGroupCount),
    [profile, adminGroupCount]
  );

  const refreshAdminAccess = useCallback(async () => {
    if (!user?.id) {
      setAdminGroupCount(0);
      setModeState('member');
      setLoading(false);
      return;
    }

    const count = isVerifiedAdmin(profile) ? await countAdminGroups(user.id) : 0;
    setAdminGroupCount(count);

    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const preferred = stored === 'admin' || stored === 'member' ? stored : null;

    if (canUseAdminMode(profile, count)) {
      setModeState(preferred === 'member' ? 'member' : 'admin');
    } else {
      setModeState('member');
    }

    setLoading(false);
  }, [profile, user?.id]);

  useEffect(() => {
    setLoading(true);
    void refreshAdminAccess();
  }, [refreshAdminAccess]);

  const setMode = useCallback(
    (next: AppMode) => {
      if (next === 'admin' && !canAdmin) return;
      setModeState(next);
      void AsyncStorage.setItem(STORAGE_KEY, next);
    },
    [canAdmin]
  );

  const toggleMode = useCallback(() => {
    setMode(mode === 'admin' ? 'member' : 'admin');
  }, [mode, setMode]);

  return (
    <AdminModeContext.Provider
      value={{ mode, canAdmin, adminGroupCount, setMode, toggleMode, refreshAdminAccess, loading }}>
      {children}
    </AdminModeContext.Provider>
  );
}

export function useAdminMode() {
  const ctx = useContext(AdminModeContext);
  if (!ctx) throw new Error('useAdminMode must be used within AdminModeProvider');
  return ctx;
}
