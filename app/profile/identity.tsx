import { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { IdentityStepProgress } from '@/components/IdentityStepProgress';
import { IdentityVerifiedRow } from '@/components/IdentityVerifiedRow';
import { Badge, Button, Card, Text } from '@/components/ui';
import { OtpVerificationCard } from '@/components/OtpVerificationCard';
import { NinVerificationCard } from '@/components/NinVerificationCard';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminMode } from '@/contexts/AdminModeContext';
import { useTranslation } from '@/contexts/LanguageContext';
import {
  getIdentityStatus,
  IDENTITY_STATUS_LABEL_KEYS,
  identityStatusFromProfile,
  isVerifiedAdmin,
  submitIdentityVerification,
  submitPlaceholderIdentityVerification,
  type IdentityStatus,
} from '@/lib/identity-verification';
import { PLACEHOLDER_IDENTITY_ENABLED } from '@/lib/identity-config';
import {
  getMissingIdentitySetupItems,
  isOtpVerified,
  isPhoneOtpVerified,
  isEmailOtpVerified,
  isProfileReadyForIdentityVerification,
  isReadyForOtpIdentityComplete,
  isYouverifyVerified,
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
  const { refreshAdminAccess } = useAdminMode();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const router = useRouter();
  const [status, setStatus] = useState<IdentityStatus>(() => identityStatusFromProfile(profile));
  const [submitting, setSubmitting] = useState(false);

  const missing = getMissingIdentitySetupItems(profile);
  const profileReady = missing.length === 0;
  const profileReadyForPlaceholder = isProfileReadyForIdentityVerification(profile);
  const phoneVerified = isPhoneOtpVerified(profile);
  const emailVerified = isEmailOtpVerified(profile);
  const readyToComplete = isReadyForOtpIdentityComplete(profile, user?.email);
  const otpVerified = isOtpVerified(profile);
  const ninVerified = isYouverifyVerified(profile);
  const hasEmail = Boolean(profile?.email?.trim() || user?.email?.trim());
  const profileStepDone = profileReady && hasEmail;

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
              await refreshAdminAccess();
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

  const handleNinVerified = () =>
    void (async () => {
      await refreshProfile();
      await refreshAdminAccess();
      setStatus('verified');
    })();

  const handleQuickVerify = () => {
    if (!user?.id || !canSave || !profileReadyForPlaceholder) return;

    Alert.alert(t('identity.placeholderTitle'), t('identity.placeholderBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('identity.quickVerifyButton'),
        onPress: () =>
          void (async () => {
            setSubmitting(true);
            try {
              const next = await submitPlaceholderIdentityVerification();
              setStatus(next);
              await refreshProfile();
              await refreshAdminAccess();
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
          {ninVerified ? <Badge label={t('identity.ninBadge')} variant="success" /> : null}
        </View>
        <Text variant="bodySmall" color="secondary" style={styles.hint}>
          {t('identity.hint')}
        </Text>
      </Card>

      {!isVerifiedAdmin(profile) ? (
        <IdentityStepProgress
          profileDone={profileStepDone}
          phoneDone={phoneVerified}
          emailDone={emailVerified}
          ninDone={ninVerified}
        />
      ) : null}

      {profileStepDone ? (
        <IdentityVerifiedRow
          label={t('identity.step1Title')}
          detail={[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || profile?.full_name || undefined}
        />
      ) : (
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
      )}

      {profileStepDone ? (
        <>
          {phoneVerified ? (
            <IdentityVerifiedRow label={t('otp.phoneVerified')} detail={profile?.phone ?? undefined} />
          ) : (
            <OtpVerificationCard
              channel="phone"
              title={t('otp.phoneTitle')}
              subtitle={t('otp.phoneSubtitle', { phone: profile?.phone ?? '' })}
              verified={false}
              verifiedLabel={t('otp.phoneVerified')}
              onVerified={() => void refreshProfile()}
            />
          )}

          {emailVerified ? (
            <IdentityVerifiedRow
              label={t('otp.emailVerified')}
              detail={profile?.email ?? user?.email ?? undefined}
            />
          ) : (
            <OtpVerificationCard
              channel="email"
              title={t('otp.emailTitle')}
              subtitle={t('otp.emailSubtitle', {
                email: profile?.email ?? user?.email ?? '',
              })}
              verified={false}
              verifiedLabel={t('otp.emailVerified')}
              onVerified={() => void refreshProfile()}
            />
          )}
        </>
      ) : null}

      {PLACEHOLDER_IDENTITY_ENABLED && profileReadyForPlaceholder && !isVerifiedAdmin(profile) ? (
        <Card variant="standard" style={styles.card}>
          <Text variant="bodyMedium" style={styles.sectionTitle}>
            {t('identity.quickVerifyTitle')}
          </Text>
          <Text variant="bodySmall" color="secondary" style={styles.sectionBody}>
            {t('identity.quickVerifyBody')}
          </Text>
          <Button
            title={t('identity.quickVerifyButton')}
            onPress={handleQuickVerify}
            loading={submitting}
            variant="secondary"
            style={styles.editBtn}
          />
        </Card>
      ) : null}

      {readyToComplete && !isVerifiedAdmin(profile) ? (
        <NinVerificationCard onVerified={handleNinVerified} />
      ) : null}

      {PLACEHOLDER_IDENTITY_ENABLED && readyToComplete && !isVerifiedAdmin(profile) ? (
        <Button
          title={t('identity.completeButtonOtpOnly')}
          onPress={handleComplete}
          loading={submitting}
          variant="secondary"
          style={styles.otpOnlyBtn}
        />
      ) : null}

      {isVerifiedAdmin(profile) ? (
        <Text variant="bodySmall" color="secondary" style={styles.reviewNote}>
          {ninVerified
            ? t('identity.verifiedYouverifyNote')
            : otpVerified
              ? t('identity.verifiedOtpNote')
              : t('identity.verifiedNote')}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  statusCard: { marginBottom: spacing.sm },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.sm },
  hint: { lineHeight: 20 },
  card: { marginBottom: spacing.sm },
  sectionTitle: { fontWeight: '700', marginBottom: spacing.xs },
  sectionBody: { lineHeight: 20 },
  missingWrap: { marginTop: spacing.sm, gap: spacing.xs },
  editBtn: { marginTop: spacing.sm, marginBottom: 0 },
  otpOnlyBtn: { marginTop: spacing.xs },
  reviewNote: { marginTop: spacing.md, lineHeight: 20, textAlign: 'center' },
});
