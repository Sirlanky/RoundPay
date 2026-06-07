import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Text } from '@/components/ui/Text';
import { useTranslation } from '@/contexts/LanguageContext';
import { sendIdentityOtp, verifyIdentityOtp, type IdentityOtpChannel } from '@/lib/identity-otp';
import { messageFromGroupError } from '@/lib/group-errors';
import { spacing } from '@/theme';

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
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sentHint, setSentHint] = useState('');

  const handleSend = async () => {
    setSending(true);
    setSentHint('');
    try {
      const result = await sendIdentityOtp(channel);
      setSentHint(
        channel === 'phone'
          ? t('otp.sentPhone', { destination: result.destination })
          : t('otp.sentEmail', { destination: result.destination })
      );
    } catch (e) {
      Alert.alert(t('otp.sendFailedTitle'), messageFromGroupError(e));
    }
    setSending(false);
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
      onVerified();
      Alert.alert(t('otp.verifiedTitle'), verifiedLabel);
    } catch (e) {
      Alert.alert(t('otp.verifyFailedTitle'), messageFromGroupError(e));
    }
    setVerifying(false);
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
          {sentHint ? (
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
  expiryHint: { marginTop: spacing.sm, lineHeight: 17, textAlign: 'center' },
});
