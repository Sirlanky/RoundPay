import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { countAdminGroups } from '@/lib/admin/role';

interface AdminModeContextValue {
  /** True when the user administers at least one group. Drives the contextual "Managing" surfaces. */
  managesGroups: boolean;
  adminGroupCount: number;
  refreshAdminAccess: () => Promise<void>;
  loading: boolean;
}

const AdminModeContext = createContext<AdminModeContextValue | undefined>(undefined);

export function AdminModeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [adminGroupCount, setAdminGroupCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshAdminAccess = useCallback(async () => {
    if (!user?.id) {
      setAdminGroupCount(0);
      setLoading(false);
      return;
    }

    setAdminGroupCount(await countAdminGroups(user.id));
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    setLoading(true);
    void refreshAdminAccess();
  }, [refreshAdminAccess]);

  const value = useMemo(
    () => ({
      managesGroups: adminGroupCount > 0,
      adminGroupCount,
      refreshAdminAccess,
      loading,
    }),
    [adminGroupCount, refreshAdminAccess, loading]
  );

  return <AdminModeContext.Provider value={value}>{children}</AdminModeContext.Provider>;
}

export function useAdminMode() {
  const ctx = useContext(AdminModeContext);
  if (!ctx) throw new Error('useAdminMode must be used within AdminModeProvider');
  return ctx;
}
