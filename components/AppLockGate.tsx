import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Modal, Pressable, StyleSheet, Text, View, type AppStateStatus } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import Colors, { brand } from '@/constants/Colors';
import {
  authenticateWithBiometrics,
  getUnlockMethodLabel,
  isAppLockEnabled,
} from '@/lib/app-lock';
import { spacing } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

/** Ignore resume-lock briefly after a successful unlock (auth UI causes inactive→active). */
const UNLOCK_GRACE_MS = 3000;

interface Props {
  children: React.ReactNode;
}

export function AppLockGate({ children }: Props) {
  const { session, loading } = useAuth();
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [locked, setLocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [unlockMethod, setUnlockMethod] = useState('Biometrics');
  const [unlocking, setUnlocking] = useState(false);
  const unlockedRef = useRef(false);
  const autoPromptedRef = useRef(false);
  const unlockingRef = useRef(false);
  const lastUnlockedAtRef = useRef(0);
  const appState = useRef(AppState.currentState);

  const userId = session?.user?.id;

  useEffect(() => {
    void getUnlockMethodLabel().then(setUnlockMethod);
  }, []);

  const tryUnlock = useCallback(async () => {
    if (unlockingRef.current) return false;
    unlockingRef.current = true;
    setUnlocking(true);
    try {
      const ok = await authenticateWithBiometrics(t('security.appLock.unlockTitle'));
      if (ok) {
        unlockedRef.current = true;
        lastUnlockedAtRef.current = Date.now();
        setLocked(false);
      }
      return ok;
    } finally {
      unlockingRef.current = false;
      setUnlocking(false);
    }
  }, [t]);

  useEffect(() => {
    if (loading) return;

    if (!userId) {
      unlockedRef.current = false;
      setLocked(false);
      setChecking(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      const enabled = await isAppLockEnabled();
      if (cancelled) return;

      if (!enabled) {
        unlockedRef.current = true;
        setLocked(false);
        setChecking(false);
        return;
      }

      if (!unlockedRef.current) {
        setLocked(true);
      }
      setChecking(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, userId]);

  useEffect(() => {
    if (!userId) return;

    const onChange = (next: AppStateStatus) => {
      const prev = appState.current;
      appState.current = next;

      // Face ID / passcode UI uses inactive, not background — do not treat that as leaving the app.
      if (unlockingRef.current) return;
      if (Date.now() - lastUnlockedAtRef.current < UNLOCK_GRACE_MS) return;
      if (prev !== 'background' || next !== 'active') return;

      void isAppLockEnabled().then((enabled) => {
        if (!enabled) return;
        unlockedRef.current = false;
        autoPromptedRef.current = false;
        setLocked(true);
      });
    };

    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [userId]);

  useEffect(() => {
    if (!locked || checking) {
      autoPromptedRef.current = false;
      return;
    }
    if (autoPromptedRef.current) return;
    autoPromptedRef.current = true;
    void tryUnlock();
  }, [locked, checking, tryUnlock]);

  if (checking) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <Modal visible={locked} animationType="fade" presentationStyle="fullScreen">
        <View style={[styles.overlay, { backgroundColor: colors.background }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t('security.appLock.unlockTitle')}</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            {t('security.appLock.unlockHint', { method: unlockMethod })}
          </Text>
          <Pressable
            onPress={() => void tryUnlock()}
            disabled={unlocking}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: brand.primary,
                opacity: unlocking ? 0.6 : pressed ? 0.9 : 1,
              },
            ]}>
            <Text style={styles.buttonLabel}>
              {unlocking ? t('security.appLock.unlocking') : t('security.appLock.unlockButton')}
            </Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  hint: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: spacing.md },
  button: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    minWidth: 220,
    alignItems: 'center',
  },
  buttonLabel: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
