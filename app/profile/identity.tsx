import { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { Badge, Button, Card, Text } from '@/components/ui';
import { OtpVerificationCard } from '@/components/OtpVerificationCard';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import {
  getIdentityStatus,
  IDENTITY_STATUS_LABEL_KEYS,
  identityStatusFromProfile,
  isVerifiedAdmin,
  submitIdentityVerification,
  type IdentityStatus,
} from '@/lib/identity-verification';
import {
  getMissingIdentitySetupItems,
  isOtpVerified,
  isPhoneOtpVerified,
  isEmailOtpVerified,
  isReadyForOtpIdentityComplete,
} from '@/lib/identity-setup';
import { messageFromGroupError } from '@/lib/group-errors';
import type { TranslationKey } from '@/lib/i18n/keys';
import { spacing } from '@/theme';

const MISSING_KEYS: Record<'name' | 'phone', TranslationKey> = {
  name: 'identity.missingName',
  phone: 'identity.missingPhone',
};

function statusVariant(status: IdentityStatus): 'neutral' | 'warning' | 'success' {
  if (status === 'verified') return 'success';
  if (status === 'in_review') return 'warning';
  return 'neutral';
}

export default function IdentityVerificationScreen() {
  const { user, profile, canSave, refreshProfile } = useAuth();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const router = useRouter();
  const [status, setStatus] = useState<IdentityStatus>(() => identityStatusFromProfile(profile));
  const [submitting, setSubmitting] = useState(false);

  const missing = getMissingIdentitySetupItems(profile);
  const profileReady = missing.length === 0;
  const phoneVerified = isPhoneOtpVerified(profile);
  const emailVerified = isEmailOtpVerified(profile);
  const readyToComplete = isReadyForOtpIdentityComplete(profile, user?.email);
  const otpVerified = isOtpVerified(profile);
  const hasEmail = Boolean(profile?.email?.trim() || user?.email?.trim());

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('profile.identity') });
  }, [navigation, t]);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setStatus('not_started');
      return;
    }
    await refreshProfile();
    if (profile?.identity_status) {
      setStatus(identityStatusFromProfile(profile));
      return;
    }
    setStatus(await getIdentityStatus(user.id));
  }, [profile?.identity_status, refreshProfile, user?.id]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const handleComplete = () => {
    if (!user?.id || !canSave || !readyToComplete) return;

    Alert.alert(t('identity.confirmTitle'), t('identity.confirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('identity.submitButton'),
        onPress: () =>
          void (async () => {
            setSubmitting(true);
            try {
              const next = await submitIdentityVerification();
              setStatus(next);
              await refreshProfile();
              Alert.alert(t('identity.submittedTitle'), t('identity.submittedBody'));
            } catch (e) {
              Alert.alert('Could not complete verification', messageFromGroupError(e));
            } finally {
              setSubmitting(false);
            }
          })(),
      },
    ]);
  };

  return (
    <Screen contentStyle={styles.content}>
      <Card variant="elevated" style={styles.statusCard}>
        <Text variant="caption" color="secondary">
          {t('identity.statusLabel')}
        </Text>
        <View style={styles.statusRow}>
          <Badge label={t(IDENTITY_STATUS_LABEL_KEYS[status])} variant={statusVariant(status)} />
          {otpVerified ? <Badge label={t('identity.otpBadge')} variant="success" /> : null}
        </View>
        <Text variant="bodySmall" color="secondary" style={styles.hint}>
          {t('identity.hint')}
        </Text>
        <Text variant="bodySmall" color="secondary" style={styles.hint}>
          {t('identity.adminRequirementNote')}
        </Text>
      </Card>

      {!profileReady || !hasEmail ? (
        <Card variant="standard" style={styles.card}>
          <Text variant="bodyMedium" style={styles.sectionTitle}>
            {t('identity.step1Title')}
          </Text>
          <Text variant="bodySmall" color="secondary" style={styles.sectionBody}>
            {t('identity.step1Body')}
          </Text>
          <View style={styles.missingWrap}>
            {missing.map((item) => (
              <Text key={item} variant="bodySmall" color="secondary">
                • {t(MISSING_KEYS[item])}
              </Text>
            ))}
            {!hasEmail ? (
              <Text variant="bodySmall" color="secondary">
                • {t('identity.missingEmail')}
              </Text>
            ) : null}
          </View>
          <Button
            title={t('identity.editProfileButton')}
            variant="secondary"
            onPress={() => router.push('/(tabs)/profile?openEdit=1')}
            style={styles.editBtn}
          />
        </Card>
      ) : null}

      {profileReady && hasEmail ? (
        <>
          <OtpVerificationCard
            channel="phone"
            title={t('otp.phoneTitle')}
            subtitle={t('otp.phoneSubtitle', { phone: profile?.phone ?? '' })}
            verified={phoneVerified}
            verifiedLabel={t('otp.phoneVerified')}
            onVerified={() => void refreshProfile()}
          />
          <OtpVerificationCard
            channel="email"
            title={t('otp.emailTitle')}
            subtitle={t('otp.emailSubtitle', {
              email: profile?.email ?? user?.email ?? '',
            })}
            verified={emailVerified}
            verifiedLabel={t('otp.emailVerified')}
            onVerified={() => void refreshProfile()}
          />
        </>
      ) : null}

      {readyToComplete && !isVerifiedAdmin(profile) ? (
        <Button title={t('identity.completeButton')} onPress={handleComplete} loading={submitting} />
      ) : null}

      {isVerifiedAdmin(profile) ? (
        <Text variant="bodySmall" color="secondary" style={styles.reviewNote}>
          {otpVerified ? t('identity.verifiedOtpNote') : t('identity.verifiedNote')}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  statusCard: { marginBottom: spacing.md },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.sm },
  hint: { lineHeight: 20, marginTop: spacing.xs },
  card: { marginBottom: spacing.sm },
  sectionTitle: { fontWeight: '700', marginBottom: spacing.xs },
  sectionBody: { lineHeight: 20 },
  missingWrap: { marginTop: spacing.sm, gap: spacing.xs },
  editBtn: { marginTop: spacing.sm, marginBottom: 0 },
  reviewNote: { marginTop: spacing.md, lineHeight: 20, textAlign: 'center' },
});
