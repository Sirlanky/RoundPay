import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Button } from '@/components/ui';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Text } from '@/components/ui/Text';
import { useTranslation } from '@/contexts/LanguageContext';
import { sendIdentityOtp, verifyIdentityOtp, type IdentityOtpChannel } from '@/lib/identity-otp';
import { messageFromGroupError } from '@/lib/group-errors';
import { primaryAlpha, spacing, useThemeTokens } from '@/theme';

interface Props {
  channel: IdentityOtpChannel;
  title: string;
  subtitle: string;
  verified: boolean;
  verifiedLabel: string;
  onVerified: () => void;
}

export function OtpVerificationCard({
  channel,
  title,
  subtitle,
  verified,
  verifiedLabel,
  onVerified,
}: Props) {
  const { t } = useTranslation();
  const { colors, scheme } = useThemeTokens();
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sentHint, setSentHint] = useState('');
  const [devMode, setDevMode] = useState(false);
  const [devCode, setDevCode] = useState('');

  const handleSend = async () => {
    setSending(true);
    setSentHint('');
    setDevMode(false);
    setDevCode('');
    try {
      const result = await sendIdentityOtp(channel);
      const isDev = result.status === 'dev' || Boolean(result.dev_code);

      if (isDev && result.dev_code) {
        setDevMode(true);
        setDevCode(result.dev_code);
        setCode(result.dev_code);
        setSentHint(
          channel === 'phone' ? t('otp.devModePhoneBody') : t('otp.devModeEmailBody')
        );
        return;
      }

      setSentHint(
        channel === 'phone'
          ? t('otp.sentPhone', { destination: result.destination })
          : t('otp.sentEmail', { destination: result.destination })
      );
    } catch (e) {
      Alert.alert(t('otp.sendFailedTitle'), messageFromGroupError(e));
    } finally {
      setSending(false);
    }
  };

  const handleCopyDevCode = async () => {
    if (!devCode) return;
    await Clipboard.setStringAsync(devCode);
    Alert.alert(t('otp.devCodeCopiedTitle'), t('otp.devCodeCopiedBody'));
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      Alert.alert(t('otp.missingCodeTitle'), t('otp.missingCodeBody'));
      return;
    }
    setVerifying(true);
    try {
      await verifyIdentityOtp(channel, code);
      setCode('');
      setSentHint('');
      setDevMode(false);
      setDevCode('');
      onVerified();
      Alert.alert(t('otp.verifiedTitle'), verifiedLabel);
    } catch (e) {
      Alert.alert(t('otp.verifyFailedTitle'), messageFromGroupError(e));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Card variant="standard" style={styles.card}>
      <Text variant="bodyMedium" style={styles.title}>
        {title}
      </Text>
      <Text variant="bodySmall" color="secondary" style={styles.subtitle}>
        {subtitle}
      </Text>

      {verified ? (
        <Text variant="bodySmall" color="success" style={styles.verified}>
          {verifiedLabel}
        </Text>
      ) : (
        <>
          <Button
            title={t('otp.sendCode')}
            onPress={handleSend}
            loading={sending}
            variant="secondary"
            style={styles.btn}
          />

          {devMode && devCode ? (
            <View
              style={[
                styles.devBanner,
                {
                  backgroundColor: primaryAlpha(scheme, 12),
                  borderColor: primaryAlpha(scheme, 32),
                },
              ]}>
              <Text variant="bodySmall" style={{ fontWeight: '700', color: colors.textPrimary }}>
                {channel === 'phone' ? t('otp.devModePhoneTitle') : t('otp.devModeEmailTitle')}
              </Text>
              <Text variant="bodySmall" color="secondary" style={styles.devBody}>
                {sentHint}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('otp.devCodeCopyA11y', { code: devCode })}
                onPress={() => void handleCopyDevCode()}
                style={[styles.devCodeBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text variant="headingMedium" style={styles.devCodeText}>
                  {devCode}
                </Text>
                <Text variant="caption" color="secondary">
                  {t('otp.devCodeTapCopy')}
                </Text>
              </Pressable>
              <Text variant="caption" color="secondary" style={styles.devVerifyHint}>
                {t('otp.devModeVerifyHint')}
              </Text>
            </View>
          ) : sentHint ? (
            <Text variant="caption" color="secondary" style={styles.sentHint}>
              {sentHint}
            </Text>
          ) : null}

          <Input
            label={t('otp.codeLabel')}
            placeholder={t('otp.codePlaceholder')}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={8}
          />
          <Button title={t('otp.verifyCode')} onPress={handleVerify} loading={verifying} />
          <Text variant="caption" color="secondary" style={styles.expiryHint}>
            {t('otp.expiryHint')}
          </Text>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  title: { fontWeight: '700', marginBottom: spacing.xs },
  subtitle: { lineHeight: 20, marginBottom: spacing.sm },
  verified: { fontWeight: '600' },
  btn: { marginBottom: spacing.sm },
  sentHint: { marginBottom: spacing.sm, lineHeight: 17 },
  devBanner: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  devBody: { lineHeight: 18 },
  devCodeBox: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  devCodeText: {
    letterSpacing: 4,
    fontWeight: '800',
    marginBottom: 4,
  },
  devVerifyHint: { lineHeight: 17, textAlign: 'center' },
  expiryHint: { marginTop: spacing.sm, lineHeight: 17, textAlign: 'center' },
});
