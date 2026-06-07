import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Modal, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Alert } from 'react-native';
import { Button } from '@/components/Button';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { radius, spacing } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

function deviceLabel(): string {
  if (Device.modelName) return Device.modelName;
  if (Platform.OS === 'web') return 'Web browser';
  return Platform.OS === 'ios' ? 'iPhone' : 'Android device';
}

function osLabel(): string {
  const version = Device.osVersion ?? Platform.Version;
  return `${Platform.OS} ${version}`;
}

export function ActiveDevicesSheet({ visible, onClose }: Props) {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const signOutOthers = () => {
    Alert.alert(t('security.devices.signOutOthersConfirmTitle'), t('security.devices.signOutOthersConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('security.devices.signOutOthers'),
        style: 'destructive',
        onPress: () =>
          void supabase.auth.signOut({ scope: 'others' }).then(({ error }) => {
            if (error) {
              Alert.alert(t('security.devices.actionFailedTitle'), error.message);
              return;
            }
            Alert.alert(t('security.devices.signOutOthersDoneTitle'), t('security.devices.signOutOthersDoneBody'));
          }),
      },
    ]);
  };

  const signOutEverywhere = () => {
    Alert.alert(
      t('security.devices.signOutEverywhereConfirmTitle'),
      t('security.devices.signOutEverywhereConfirmBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('security.devices.signOutEverywhere'),
          style: 'destructive',
          onPress: () =>
            void signOut()
              .then(() => onClose())
              .catch((e) =>
                Alert.alert(
                  t('security.devices.actionFailedTitle'),
                  e instanceof Error ? e.message : t('security.devices.actionFailedTitle')
                )
              ),
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { color: colors.text }]}>{t('security.devices.title')}</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>{t('security.devices.hint')}</Text>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>{t('security.devices.thisDevice')}</Text>
            <Text style={[styles.cardValue, { color: colors.text }]}>{deviceLabel()}</Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              {t('security.devices.os')}: {osLabel()}
            </Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              {t('security.devices.appVersion')}: v{appVersion}
            </Text>
            {user?.email ? (
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                {t('security.devices.signedIn')}: {user.email}
              </Text>
            ) : null}
          </View>

          <Button title={t('security.devices.signOutOthers')} onPress={signOutOthers} variant="secondary" />
          <Button title={t('security.devices.signOutEverywhere')} onPress={signOutEverywhere} variant="secondary" />
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
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  cardLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  cardValue: { fontSize: 17, fontWeight: '700' },
  meta: { fontSize: 13, lineHeight: 18 },
  footer: { padding: spacing.lg, paddingTop: spacing.sm },
});
