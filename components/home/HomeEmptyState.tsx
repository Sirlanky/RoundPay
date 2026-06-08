import { SymbolView } from 'expo-symbols';
import { ReactNode, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { PlatformIcon } from '@/components/navigation/PlatformIcon';
import { Card, Text } from '@/components/ui';
import { HomeFeatureSheet, type HomeFeatureId } from '@/components/home/HomeFeatureSheet';
import { useTranslation } from '@/contexts/LanguageContext';
import { primaryAlpha, spacing, useThemeTokens } from '@/theme';
import { HomeSectionTitle } from './HomeSectionTitle';

interface LandingProps {
  title: string;
  subtitle: string;
  onCreate: () => void;
  onJoin: () => void;
  extraActions?: ReactNode;
}

function HeroCta({
  label,
  onPress,
  variant,
}: {
  label: string;
  onPress: () => void;
  variant: 'filled' | 'outline';
}) {
  const { colors, radius } = useThemeTokens();
  const filled = variant === 'filled';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.cta,
        {
          borderRadius: radius.md,
          backgroundColor: filled ? colors.textInverse : 'transparent',
          borderColor: 'rgba(255,255,255,0.55)',
          borderWidth: filled ? 0 : 1.5,
          opacity: pressed ? 0.92 : 1,
        },
      ]}>
      <Text
        variant="bodyLarge"
        style={{
          color: filled ? colors.primary : colors.textInverse,
          fontWeight: '700',
          textAlign: 'center',
        }}>
        {label}
      </Text>
    </Pressable>
  );
}

function HomeEmptyLanding({ title, subtitle, onCreate, onJoin, extraActions }: LandingProps) {
  const { t } = useTranslation();
  const { colors, scheme, radius, shadow } = useThemeTokens();
  const [activeFeature, setActiveFeature] = useState<HomeFeatureId | null>(null);

  const steps = [
    { icon: { ios: 'person.3.fill', android: 'group', web: 'group' }, text: t('home.stepCreateJoin') },
    { icon: { ios: 'person.badge.plus', android: 'person_add', web: 'person_add' }, text: t('home.stepInvite') },
    { icon: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }, text: t('home.stepContribute') },
    { icon: { ios: 'arrow.triangle.2.circlepath', android: 'sync', web: 'sync' }, text: t('home.stepPayouts') },
  ] as const;

  const features = [
    { id: 'secure' as const, label: t('home.featureSecure'), desc: t('home.featureSecureDesc'), icon: { ios: 'lock.shield.fill', android: 'verified_user', web: 'verified_user' } },
    { id: 'schedule' as const, label: t('home.featureSchedule'), desc: t('home.featureScheduleDesc'), icon: { ios: 'calendar.badge.clock', android: 'schedule', web: 'schedule' } },
    { id: 'turns' as const, label: t('home.featureTurns'), desc: t('home.featureTurnsDesc'), icon: { ios: 'arrow.triangle.2.circlepath', android: 'sync', web: 'sync' } },
  ] as const;

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.hero,
          {
            backgroundColor: colors.primary,
            borderRadius: radius.xl,
          },
          shadow('large'),
        ]}>
        <View style={[styles.heroBlob, styles.heroBlobA, { backgroundColor: 'rgba(255,255,255,0.12)' }]} />
        <View style={[styles.heroBlob, styles.heroBlobB, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />

        <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
          <Text variant="caption" style={styles.badgeText}>
            {t('home.circleBadge')}
          </Text>
        </View>

        <Text variant="display" style={styles.heroTitle}>
          {title}
        </Text>
        <Text variant="bodyMedium" style={styles.heroSubtitle}>
          {subtitle}
        </Text>

        <View style={styles.heroActions}>
          <HeroCta label={t('home.createGroup')} onPress={onCreate} variant="filled" />
          <HeroCta label={t('home.joinGroup')} onPress={onJoin} variant="outline" />
          {extraActions}
        </View>
      </View>

      <View style={styles.featureRow}>
        {features.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setActiveFeature(item.id)}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            style={({ pressed }) => [
              styles.featureChip,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.lg,
                opacity: pressed ? 0.92 : 1,
              },
              shadow('small'),
            ]}>
            <View style={[styles.featureIcon, { backgroundColor: primaryAlpha(scheme, 12) }]}>
              <PlatformIcon name={item.icon} size={18} color={colors.primary} />
            </View>
            <Text variant="caption" color="secondary" style={styles.featureLabel}>
              {item.label}
            </Text>
            <Text variant="caption" color="muted" style={styles.featureDesc}>
              {item.desc}
            </Text>
            <Text variant="caption" color="accent" style={styles.featureTap}>
              {t('home.featureLearnMore')}
            </Text>
          </Pressable>
        ))}
      </View>

      <HomeFeatureSheet feature={activeFeature} onClose={() => setActiveFeature(null)} />

      <HomeSectionTitle title={t('home.howItWorks')} />
      <Card variant="elevated" style={styles.stepsCard}>
        {steps.map((step, index) => (
          <View key={step.text} style={styles.stepRow}>
            <View style={styles.stepRail}>
              <View style={[styles.stepDot, { backgroundColor: colors.primary }]}>
                <Text variant="caption" style={styles.stepDotText}>
                  {index + 1}
                </Text>
              </View>
              {index < steps.length - 1 ? (
                <View style={[styles.stepLine, { backgroundColor: primaryAlpha(scheme, 24) }]} />
              ) : null}
            </View>
            <View style={[styles.stepContent, index < steps.length - 1 && styles.stepContentBorder, { borderBottomColor: colors.border }]}>
              <View style={[styles.stepIcon, { backgroundColor: primaryAlpha(scheme, 12) }]}>
                <SymbolView name={step.icon as never} tintColor={colors.primary} size={18} />
              </View>
              <Text variant="bodyMedium" style={styles.stepText}>
                {step.text}
              </Text>
            </View>
          </View>
        ))}
      </Card>

      <HomeSectionTitle title={t('home.invitations')} />
      <Card variant="standard" style={styles.inviteCard}>
        <View style={[styles.inviteIconWrap, { backgroundColor: colors.surfaceSecondary }]}>
          <SymbolView
            name={{ ios: 'envelope.open', android: 'mail', web: 'mail' } as never}
            tintColor={colors.textMuted}
            size={22}
          />
        </View>
        <View style={styles.inviteBody}>
          <Text variant="bodyMedium" color="secondary">
            {t('home.noInvitations')}
          </Text>
          <Text variant="caption" color="muted" style={styles.inviteHint}>
            {t('home.invitationsHint')}
          </Text>
        </View>
      </Card>
    </View>
  );
}

interface NoGroupsProps {
  onCreate: () => void;
  onJoin: () => void;
}

export function HomeNoGroupsEmpty({ onCreate, onJoin }: NoGroupsProps) {
  const { t } = useTranslation();

  return (
    <HomeEmptyLanding
      title={t('home.startFirstCircle')}
      subtitle={t('home.startFirstCircleSubtitle')}
      onCreate={onCreate}
      onJoin={onJoin}
    />
  );
}

interface NoActiveProps {
  onCreate: () => void;
  onJoin: () => void;
  onViewGroups: () => void;
}

export function HomeNoActiveEmpty({ onCreate, onJoin, onViewGroups }: NoActiveProps) {
  const { t } = useTranslation();

  return (
    <HomeEmptyLanding
      title={t('home.noActiveCircle')}
      subtitle={t('home.noActiveCircleSubtitle')}
      onCreate={onCreate}
      onJoin={onJoin}
      extraActions={
        <HeroCta label={t('home.viewGroups')} onPress={onViewGroups} variant="outline" />
      }
    />
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  hero: {
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    marginBottom: spacing.xs,
  },
  heroBlob: {
    position: 'absolute',
    borderRadius: 999,
  },
  heroBlobA: {
    width: 180,
    height: 180,
    top: -60,
    right: -40,
  },
  heroBlobB: {
    width: 120,
    height: 120,
    bottom: -30,
    left: -20,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: spacing.md,
  },
  badgeText: {
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 34,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  heroActions: { gap: spacing.sm },
  cta: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  featureChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  featureLabel: { textAlign: 'center', fontWeight: '600', marginBottom: 2 },
  featureDesc: { textAlign: 'center', lineHeight: 14, fontSize: 10 },
  featureTap: { textAlign: 'center', fontWeight: '600', marginTop: 4, fontSize: 10 },
  stepsCard: { paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, marginBottom: spacing.sm },
  stepRow: { flexDirection: 'row', minHeight: 72 },
  stepRail: { width: 28, alignItems: 'center', paddingTop: 18 },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotText: { color: '#FFFFFF', fontWeight: '800', fontSize: 11 },
  stepLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
    marginBottom: -4,
    borderRadius: 1,
  },
  stepContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingRight: spacing.xs,
  },
  stepContentBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { flex: 1, fontWeight: '500' },
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: 0,
  },
  inviteIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteBody: { flex: 1, gap: 4 },
  inviteHint: { lineHeight: 16 },
});
