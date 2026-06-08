import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import { NIGERIAN_LANGUAGES, type AppLanguage } from '@/lib/languages';
import { primaryAlpha, radius, spacing, useThemeTokens } from '@/theme';

interface Props {
  visible: boolean;
  selected: AppLanguage;
  onSelect: (code: AppLanguage) => void;
  onClose: () => void;
}

export function LanguagePickerSheet({ visible, selected, onSelect, onClose }: Props) {
  const { t } = useTranslation();
  const { colors, scheme } = useThemeTokens();
  const [active, setActive] = useState(selected);

  useEffect(() => {
    if (visible) setActive(selected);
  }, [visible, selected]);

  const handleSelect = (code: AppLanguage) => {
    setActive(code);
    onSelect(code);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t('language.title')}</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>{t('language.hint')}</Text>

          <View style={styles.list}>
            {NIGERIAN_LANGUAGES.map((option) => {
              const isSelected = active === option.code;
              return (
                <Pressable
                  key={option.code}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => handleSelect(option.code)}
                  style={({ pressed }) => [
                    styles.row,
                    {
                      backgroundColor: isSelected ? primaryAlpha(scheme, 12) : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}>
                  <View
                    style={[
                      styles.indicator,
                      {
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? colors.primary : 'transparent',
                      },
                    ]}>
                    {isSelected ? <Text style={styles.check}>✓</Text> : null}
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={[styles.label, { color: isSelected ? colors.primary : colors.textPrimary }]}>
                      {option.label}
                    </Text>
                    {option.nativeLabel !== option.label ? (
                      <Text style={[styles.native, { color: colors.textSecondary }]}>{option.nativeLabel}</Text>
                    ) : null}
                  </View>
                  {isSelected ? (
                    <View style={[styles.selectedBadge, { backgroundColor: primaryAlpha(scheme, 24) }]}>
                      <Text style={[styles.selectedBadgeText, { color: colors.primary }]}>
                        {t('language.selected')}
                      </Text>
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
  list: { gap: spacing.sm },
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
  rowBody: { flex: 1 },
  label: { fontSize: 16, fontWeight: '600' },
  native: { fontSize: 13, marginTop: 2 },
  selectedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  selectedBadgeText: { fontSize: 11, fontWeight: '700' },
  done: { marginTop: spacing.lg },
});
