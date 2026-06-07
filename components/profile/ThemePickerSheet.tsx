import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Button } from '@/components/Button';
import Colors, { brand } from '@/constants/Colors';
import { useTranslation } from '@/contexts/LanguageContext';
import { BACKGROUND_PRESETS, type BackgroundPresetId } from '@/lib/background-presets';
import { THEME_OPTIONS, type ThemePreference } from '@/lib/theme';
import type { TranslationKey } from '@/lib/i18n/keys';
import { radius, spacing } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

const THEME_LABEL_KEYS: Record<ThemePreference, TranslationKey> = {
  system: 'theme.system',
  light: 'theme.light',
  dark: 'theme.dark',
};

interface Props {
  visible: boolean;
  selected: ThemePreference;
  selectedBackground: BackgroundPresetId;
  onSelect: (preference: ThemePreference) => void;
  onSelectBackground: (preset: BackgroundPresetId) => void;
  onClose: () => void;
}

export function ThemePickerSheet({
  visible,
  selected,
  selectedBackground,
  onSelect,
  onSelectBackground,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const [active, setActive] = useState(selected);
  const [activeBackground, setActiveBackground] = useState(selectedBackground);

  useEffect(() => {
    if (visible) {
      setActive(selected);
      setActiveBackground(selectedBackground);
    }
  }, [visible, selected, selectedBackground]);

  const handleSelect = (preference: ThemePreference) => {
    setActive(preference);
    onSelect(preference);
  };

  const handleBackgroundSelect = (preset: BackgroundPresetId) => {
    setActiveBackground(preset);
    onSelectBackground(preset);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { color: colors.text }]}>{t('theme.title')}</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>{t('theme.hint')}</Text>

          <Text style={[styles.section, { color: colors.text }]}>{t('theme.appearanceTitle')}</Text>
          <View style={styles.list}>
            {THEME_OPTIONS.map((option) => {
              const isSelected = active === option.value;
              const label = t(THEME_LABEL_KEYS[option.value]);
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => handleSelect(option.value)}
                  style={({ pressed }) => [
                    styles.row,
                    {
                      backgroundColor: isSelected ? brand.primary + '12' : colors.card,
                      borderColor: isSelected ? brand.primary : colors.border,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}>
                  <View
                    style={[
                      styles.indicator,
                      {
                        borderColor: isSelected ? brand.primary : colors.border,
                        backgroundColor: isSelected ? brand.primary : 'transparent',
                      },
                    ]}>
                    {isSelected ? <Text style={styles.check}>✓</Text> : null}
                  </View>
                  <View style={[styles.iconWrap, { backgroundColor: brand.primary + '12' }]}>
                    <SymbolView name={option.icon as never} tintColor={brand.primary} size={20} />
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={[styles.label, { color: isSelected ? brand.primary : colors.text }]}>
                      {label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.section, { color: colors.text }]}>{t('theme.backgroundTitle')}</Text>
          <Text style={[styles.hint, { color: colors.textSecondary, marginBottom: spacing.md }]}>
            {t('theme.backgroundHint')}
          </Text>
          <View style={styles.swatchGrid}>
            {BACKGROUND_PRESETS.map((preset) => {
              const isSelected = activeBackground === preset.id;
              return (
                <Pressable
                  key={preset.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => handleBackgroundSelect(preset.id)}
                  style={({ pressed }) => [
                    styles.swatchCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: isSelected ? brand.primary : colors.border,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}>
                  <View
                    style={[
                      styles.swatch,
                      {
                        backgroundColor: preset.swatch,
                        borderColor: colors.border,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.swatchLabel,
                      { color: isSelected ? brand.primary : colors.text },
                    ]}>
                    {t(preset.labelKey)}
                  </Text>
                  {isSelected ? (
                    <View style={[styles.swatchBadge, { backgroundColor: brand.primary }]}>
                      <Text style={styles.swatchBadgeText}>✓</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <Button title={t('common.done')} onPress={onClose} style={styles.done} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xl },
  title: { fontSize: 22, fontWeight: '700', marginBottom: spacing.xs },
  hint: { fontSize: 14, lineHeight: 20, marginBottom: spacing.lg },
  section: { fontSize: 16, fontWeight: '700', marginBottom: spacing.sm },
  list: { gap: spacing.sm, marginBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  indicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', lineHeight: 15 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1 },
  label: { fontSize: 16, fontWeight: '600' },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  swatchCard: {
    width: '47%',
    flexGrow: 1,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: spacing.sm,
    alignItems: 'center',
    position: 'relative',
  },
  swatch: {
    width: '100%',
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  swatchLabel: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  swatchBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  done: { marginTop: spacing.sm },
});
