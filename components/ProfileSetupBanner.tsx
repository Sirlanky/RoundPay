import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';
import { Button, Card, Text } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import { promptProfileSetupForTransfer } from '@/lib/prompt-profile-setup';
import { getProfileSetupSummary } from '@/lib/profile-setup';
import {
  clearProfileSetupReminderState,
  dismissProfileSetupReminderForToday,
  PROFILE_SETUP_REMINDER_AUTO_HIDE_MS,
  tryConsumeProfileSetupReminderShow,
} from '@/lib/profile-setup-reminder';
import type { Profile } from '@/lib/types';
import { primaryAlpha, spacing, useThemeTokens } from '@/theme';

const SWIPE_DISMISS = 72;
const TAP_SLOP = 10;
/** Resting opacity — soft, faded reminder look. */
const REMINDER_PEAK_OPACITY = 0.68;

interface Props {
  profile: Profile | null | undefined;
  /** Reminder slides in, auto-hides, and can be dismissed. Persistent stays until profile is complete. */
  variant?: 'reminder' | 'persistent';
}

export function ProfileSetupBanner({ profile, variant = 'reminder' }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { scheme, radius } = useThemeTokens();
  const { ready } = getProfileSetupSummary(profile);
  const [shown, setShown] = useState(variant === 'persistent');
  const entryY = useRef(new Animated.Value(variant === 'persistent' ? 0 : -12)).current;
  const opacity = useRef(new Animated.Value(variant === 'persistent' ? 1 : 0)).current;
  const panX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragging = useRef(false);

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const resetPan = useCallback(() => {
    panX.setValue(0);
    panY.setValue(0);
  }, [panX, panY]);

  const animateIn = useCallback(() => {
    setShown(true);
    resetPan();
    opacity.setValue(0);
    entryY.setValue(-12);
    Animated.parallel([
      Animated.timing(opacity, { toValue: REMINDER_PEAK_OPACITY, duration: 420, useNativeDriver: true }),
      Animated.spring(entryY, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 2 }),
    ]).start();
  }, [entryY, opacity, resetPan]);

  const animateOut = useCallback(
    (onDone?: () => void, direction?: { x: number; y: number }) => {
      clearHideTimer();
      const toX = direction ? direction.x * 420 : 0;
      const toY = direction ? direction.y * 280 - 12 : -12;

      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(panX, { toValue: toX, duration: 220, useNativeDriver: true }),
        Animated.timing(panY, { toValue: toY, duration: 220, useNativeDriver: true }),
        Animated.timing(entryY, { toValue: toY, duration: 220, useNativeDriver: true }),
      ]).start(() => {
        resetPan();
        entryY.setValue(-12);
        setShown(false);
        onDone?.();
      });
    },
    [clearHideTimer, entryY, opacity, panX, panY, resetPan]
  );

  const openSetup = useCallback(() => {
    clearHideTimer();
    promptProfileSetupForTransfer(profile, router, t);
  }, [clearHideTimer, profile, router, t]);

  const dismissReminder = useCallback(
    (direction?: { x: number; y: number }) => {
      void dismissProfileSetupReminderForToday().then(() => animateOut(undefined, direction));
    },
    [animateOut]
  );

  const openSetupRef = useRef(openSetup);
  const dismissReminderRef = useRef(dismissReminder);
  openSetupRef.current = openSetup;
  dismissReminderRef.current = dismissReminder;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4,
      onPanResponderGrant: () => {
        dragging.current = false;
        clearHideTimer();
      },
      onPanResponderMove: (_, gesture) => {
        if (Math.abs(gesture.dx) > TAP_SLOP || Math.abs(gesture.dy) > TAP_SLOP) {
          dragging.current = true;
        }
        panX.setValue(gesture.dx);
        panY.setValue(gesture.dy);
        const drag = Math.max(Math.abs(gesture.dx), Math.abs(gesture.dy));
        opacity.setValue(Math.max(0.22, REMINDER_PEAK_OPACITY - drag / 320));
      },
      onPanResponderRelease: (_, gesture) => {
        const { dx, dy } = gesture;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        if (absX >= SWIPE_DISMISS || absY >= SWIPE_DISMISS) {
          const direction = {
            x: absX >= absY ? Math.sign(dx) || 1 : 0,
            y: absY > absX ? Math.sign(dy) || -1 : 0,
          };
          dismissReminderRef.current(direction);
          return;
        }

        if (!dragging.current) {
          openSetupRef.current();
          return;
        }

        Animated.parallel([
          Animated.spring(panX, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 0 }),
          Animated.spring(panY, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 0 }),
          Animated.timing(opacity, { toValue: REMINDER_PEAK_OPACITY, duration: 160, useNativeDriver: true }),
        ]).start();
      },
      onPanResponderTerminate: () => {
        Animated.parallel([
          Animated.spring(panX, { toValue: 0, useNativeDriver: true }),
          Animated.spring(panY, { toValue: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: REMINDER_PEAK_OPACITY, duration: 160, useNativeDriver: true }),
        ]).start();
      },
    })
  ).current;

  useEffect(() => {
    if (ready) {
      clearHideTimer();
      void clearProfileSetupReminderState();
      if (variant === 'reminder' && shown) animateOut();
    }
  }, [animateOut, clearHideTimer, ready, shown, variant]);

  useFocusEffect(
    useCallback(() => {
      if (ready || variant !== 'reminder') return;

      let cancelled = false;

      void tryConsumeProfileSetupReminderShow().then((shouldShow) => {
        if (cancelled || !shouldShow) return;
        animateIn();
        hideTimer.current = setTimeout(() => {
          if (!cancelled) animateOut();
        }, PROFILE_SETUP_REMINDER_AUTO_HIDE_MS);
      });

      return () => {
        cancelled = true;
        clearHideTimer();
      };
    }, [animateIn, animateOut, clearHideTimer, ready, variant])
  );

  if (ready || !shown) return null;

  if (variant === 'persistent') {
    return (
      <Card variant="standard" style={styles.card}>
        <Text variant="bodyMedium" style={{ fontWeight: '700' }}>
          {t('profileSetup.bannerTitle')}
        </Text>
        <Text variant="bodySmall" color="secondary" style={styles.body}>
          {t('profileSetup.bannerBody')}
        </Text>
        <Button title={t('profileSetup.completeSetup')} onPress={openSetup} style={styles.btn} />
      </Card>
    );
  }

  const dragOpacity = panX.interpolate({
    inputRange: [-180, 0, 180],
    outputRange: [0.5, 1, 0.5],
    extrapolate: 'clamp',
  });

  const reminderSurface =
    scheme === 'dark' ? 'rgba(217, 119, 6, 0.1)' : 'rgba(255, 251, 235, 0.55)';

  return (
    <Animated.View
      style={[
        styles.reminderOuter,
        {
          opacity: Animated.multiply(opacity, dragOpacity),
          transform: [
            { translateX: panX },
            { translateY: Animated.add(entryY, panY) },
            {
              rotate: panX.interpolate({
                inputRange: [-180, 0, 180],
                outputRange: ['-4deg', '0deg', '4deg'],
                extrapolate: 'clamp',
              }),
            },
          ],
        },
      ]}
      {...panResponder.panHandlers}
      accessibilityRole="button"
      accessibilityLabel={t('profileSetup.completeSetup')}>
      <View
        style={[
          styles.reminderWrap,
          {
            backgroundColor: reminderSurface,
            borderColor: primaryAlpha(scheme, 16),
            borderRadius: radius.lg,
          },
        ]}>
        <View style={styles.reminderMain}>
          <View style={styles.reminderCopy}>
            <Text variant="bodySmall" color="secondary" style={styles.reminderTitle}>
              {t('profileSetup.reminderTitle')}
            </Text>
            <Text variant="caption" color="muted" numberOfLines={2}>
              {t('profileSetup.reminderBody')}
            </Text>
            <Text variant="caption" color="muted" style={styles.swipeHint}>
              {t('profileSetup.swipeToDismiss')}
            </Text>
          </View>
          <Text variant="caption" color="secondary" style={styles.reminderAction}>
            {t('profileSetup.completeSetup')} ›
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  body: { marginTop: spacing.xs, marginBottom: spacing.sm, lineHeight: 20 },
  btn: { marginBottom: 0 },
  reminderOuter: { marginBottom: spacing.md },
  reminderWrap: {
    borderWidth: 1,
    paddingLeft: spacing.md,
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
  },
  reminderMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  reminderCopy: { flex: 1, gap: 2 },
  reminderTitle: { fontWeight: '600' },
  reminderAction: { fontWeight: '600', flexShrink: 0, alignSelf: 'center', opacity: 0.85 },
  swipeHint: { marginTop: 2, fontStyle: 'italic' },
});
