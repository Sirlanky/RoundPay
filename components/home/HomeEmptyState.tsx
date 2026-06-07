import { SymbolView } from 'expo-symbols';
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import Colors, { brand } from '@/constants/Colors';
import { useTranslation } from '@/contexts/LanguageContext';
import { radius, spacing } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { HomeSectionTitle } from './HomeSectionTitle';

interface LandingProps {
  title: string;
  subtitle: string;
  onCreate: () => void;
  onJoin: () => void;
  extraActions?: ReactNode;
}

function HomeEmptyLanding({ title, subtitle, onCreate, onJoin, extraActions }: LandingProps) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const steps = [
    { icon: { ios: 'person.3.fill', android: 'group', web: 'group' }, text: t('home.stepCreateJoin') },
    { icon: { ios: 'person.badge.plus', android: 'person_add', web: 'person_add' }, text: t('home.stepInvite') },
    { icon: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }, text: t('home.stepContribute') },
    { icon: { ios: 'arrow.triangle.2.circlepath', android: 'sync', web: 'sync' }, text: t('home.stepPayouts') },
  ] as const;

  return (
    <View style={styles.root}>
      <Card elevated style={styles.heroCard}>
        <View style={[styles.heroIconWrap, { backgroundColor: brand.primary + '14' }]}>
          <SymbolView
            name={{ ios: 'circle.grid.3x3.fill', android: 'grid_view', web: 'grid_view' } as never}
            tintColor={brand.primary}
            size={32}
          />
        </View>
        <Text style={[styles.heroTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        <View style={styles.actions}>
          <Button title={t('home.createGroup')} onPress={onCreate} style={styles.primaryBtn} />
          <Button title={t('home.joinGroup')} onPress={onJoin} variant="secondary" style={styles.secondaryBtn} />
          {extraActions}
        </View>
      </Card>

      <HomeSectionTitle title={t('home.howItWorks')} />
      <Card elevated style={styles.stepsCard}>
        {steps.map((step, index) => (
          <View
            key={step.text}
            style={[
              styles.stepRow,
              index < steps.length - 1 && { borderBottomColor: colors.border },
            ]}>
            <View style={[styles.stepIcon, { backgroundColor: brand.primary + '12' }]}>
              <SymbolView name={step.icon as never} tintColor={brand.primary} size={18} />
            </View>
            <View style={styles.stepBody}>
              <Text style={[styles.stepLabel, { color: brand.primary }]}>
                {t('home.step', { n: index + 1 })}
              </Text>
              <Text style={[styles.stepText, { color: colors.text }]}>{step.text}</Text>
            </View>
          </View>
        ))}
      </Card>

      <HomeSectionTitle title={t('home.invitations')} />
      <Card elevated style={styles.inviteCard}>
        <View style={[styles.inviteIconWrap, { backgroundColor: colors.border + '80' }]}>
          <SymbolView
            name={{ ios: 'envelope', android: 'mail', web: 'mail' } as never}
            tintColor={colors.textSecondary}
            size={20}
          />
        </View>
        <Text style={[styles.inviteEmpty, { color: colors.textSecondary }]}>{t('home.noInvitations')}</Text>
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
        <Button
          title={t('home.viewGroups')}
          onPress={onViewGroups}
          variant="secondary"
          style={styles.secondaryBtn}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  heroCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  actions: { width: '100%', gap: spacing.xs },
  primaryBtn: { marginVertical: 0 },
  secondaryBtn: { marginVertical: 0 },
  stepsCard: { paddingVertical: spacing.xs, marginBottom: spacing.sm },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  stepBody: { flex: 1 },
  stepLabel: { fontSize: 12, fontWeight: '600', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.4 },
  stepText: { fontSize: 15, fontWeight: '500', lineHeight: 21 },
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: 0,
  },
  inviteIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteEmpty: { flex: 1, fontSize: 14, lineHeight: 20 },
});
