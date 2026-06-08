import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Button } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import {
  authenticateWithBiometrics,
  getBiometricLabel,
  getBiometricSupportInfo,
  isAppLockEnabled,
  setAppLockEnabled,
  type FaceIdSupport,
} from '@/lib/app-lock';
import { primaryAlpha, radius, spacing, useThemeTokens } from '@/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onChanged?: () => void;
}

export function AppLockSheet({ visible, onClose, onChanged }: Props) {
  const { t } = useTranslation();
  const { colors, scheme } = useThemeTokens();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('Biometrics');
  const [faceIdSupport, setFaceIdSupport] = useState<FaceIdSupport>('unavailable');
  const [canPrompt, setCanPrompt] = useState(false);

  useEffect(() => {
    if (!visible) return;
    void Promise.all([isAppLockEnabled(), getBiometricSupportInfo(), getBiometricLabel()]).then(
      ([on, info, label]) => {
        setEnabled(on);
        setFaceIdSupport(info.support);
        setCanPrompt(info.canPrompt);
        setBiometricLabel(label);
      }
    );
  }, [visible]);

  const toggle = async (next: boolean) => {
    if (!canPrompt) {
      Alert.alert(t('security.appLock.unavailableTitle'), t('security.appLock.unavailableBody'));
      return;
    }

    setLoading(true);
    const ok = await authenticateWithBiometrics(
      next ? t('security.appLock.enablePrompt') : t('security.appLock.disablePrompt')
    );
    if (!ok) {
      setLoading(false);
      return;
    }

    try {
      await setAppLockEnabled(next);
      setEnabled(next);
      onChanged?.();
    } catch (e) {
      Alert.alert(
        t('security.appLock.enableFailedTitle'),
        e instanceof Error ? e.message : t('security.appLock.enableFailedBody')
      );
    } finally {
      setLoading(false);
    }
  };

  const supportNotice =
    faceIdSupport === 'expo_go'
      ? t('security.appLock.expoGoNotice')
      : faceIdSupport === 'passcode_only'
        ? t('security.appLock.passcodeOnlyNotice')
        : null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t('security.appLock.title')}</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>{t('security.appLock.hint')}</Text>

          {supportNotice ? (
            <View style={[styles.notice, { backgroundColor: primaryAlpha(scheme, 12), borderColor: primaryAlpha(scheme, 32) }]}>
              <Text style={[styles.noticeText, { color: colors.textPrimary }]}>{supportNotice}</Text>
            </View>
          ) : null}

          <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.rowBody}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>{t('security.appLock.toggle')}</Text>
              <Text style={[styles.rowHint, { color: colors.textSecondary }]}>
                {canPrompt
                  ? faceIdSupport === 'expo_go'
                    ? t('security.appLock.expoGoToggleHint')
                    : t('security.appLock.toggleHint', { method: biometricLabel })
                  : t('security.appLock.unavailableBody')}
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={(value) => void toggle(value)}
              disabled={loading || !canPrompt}
              trackColor={{ false: colors.border, true: colors.primary + '88' }}
              thumbColor={enabled ? colors.primary : '#f4f4f5'}
            />
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Button title={t('common.done')} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md, gap: spacing.md },
  title: { fontSize: 22, fontWeight: '700' },
  hint: { fontSize: 14, lineHeight: 20 },
  notice: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  noticeText: { fontSize: 13, lineHeight: 19 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowBody: { flex: 1 },
  label: { fontSize: 15, fontWeight: '600' },
  rowHint: { fontSize: 12, lineHeight: 17, marginTop: 4 },
  footer: { padding: spacing.lg, paddingTop: spacing.sm },
});
