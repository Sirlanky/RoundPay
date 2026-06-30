import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Card, Text } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import type { PayoutSlot } from '@/lib/payout-order';
import { spacing, useThemeTokens } from '@/theme';

function roundLabel(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

interface Props {
  slots: PayoutSlot[];
  isAdmin: boolean;
  saving?: boolean;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onChangeCollector: (index: number) => void;
  onAddRound: () => void;
}

export function PayoutOrderEditor({
  slots,
  isAdmin,
  saving,
  onMoveUp,
  onMoveDown,
  onChangeCollector,
  onAddRound,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useThemeTokens();

  if (!slots.length) return null;

  return (
    <Card variant="standard" style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text variant="headingSmall">{t('payoutOrder.title')}</Text>
        {saving ? <ActivityIndicator size="small" color={colors.primary} /> : null}
      </View>

      <View style={[styles.list, { borderColor: colors.border }]}>
        {slots.map((slot, index) => (
          <View
            key={`${index}-${slot.userId}`}
            style={[
              styles.row,
              {
                borderTopColor: colors.border,
                borderTopWidth: index > 0 ? StyleSheet.hairlineWidth : 0,
              },
            ]}>
            <View style={[styles.roundBadge, { backgroundColor: colors.surfaceSecondary }]}>
              <Text variant="caption" style={styles.roundNum}>
                {roundLabel(index + 1)}
              </Text>
            </View>

            {isAdmin ? (
              <Pressable
                onPress={() => onChangeCollector(index)}
                disabled={saving}
                style={({ pressed }) => [styles.nameTap, { opacity: pressed ? 0.75 : 1 }]}>
                <Avatar name={slot.memberName} uri={slot.memberAvatarUrl} size={36} />
                <Text variant="bodyMedium" style={styles.name} numberOfLines={1}>
                  {slot.memberName}
                </Text>
                <MaterialIcons name="expand-more" size={20} color={colors.textSecondary} />
              </Pressable>
            ) : (
              <View style={styles.nameTap}>
                <Avatar name={slot.memberName} uri={slot.memberAvatarUrl} size={36} />
                <Text variant="bodyMedium" style={styles.name} numberOfLines={1}>
                  {slot.memberName}
                </Text>
              </View>
            )}

            {isAdmin ? (
              <View style={styles.controls}>
                <Pressable
                  onPress={() => onMoveUp(index)}
                  disabled={index === 0 || saving}
                  hitSlop={10}
                  style={({ pressed }) => [
                    styles.controlBtn,
                    {
                      backgroundColor: colors.surfaceSecondary,
                      opacity: index === 0 ? 0.35 : pressed ? 0.7 : 1,
                    },
                  ]}>
                  <MaterialIcons name="keyboard-arrow-up" size={24} color={colors.primary} />
                </Pressable>
                <Pressable
                  onPress={() => onMoveDown(index)}
                  disabled={index === slots.length - 1 || saving}
                  hitSlop={10}
                  style={({ pressed }) => [
                    styles.controlBtn,
                    {
                      backgroundColor: colors.surfaceSecondary,
                      opacity: index === slots.length - 1 ? 0.35 : pressed ? 0.7 : 1,
                    },
                  ]}>
                  <MaterialIcons name="keyboard-arrow-down" size={24} color={colors.primary} />
                </Pressable>
              </View>
            ) : null}
          </View>
        ))}
      </View>

      {isAdmin ? (
        <Pressable
          onPress={onAddRound}
          disabled={saving}
          style={({ pressed }) => [
            styles.addRow,
            { borderColor: colors.border, opacity: pressed ? 0.75 : 1 },
          ]}>
          <MaterialIcons name="add" size={20} color={colors.primary} />
          <Text variant="bodyMedium" style={{ color: colors.primary, fontWeight: '600' }}>
            {t('payoutOrder.addRound')}
          </Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  list: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
  },
  roundBadge: {
    minWidth: 36,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  roundNum: { fontWeight: '800', fontSize: 11 },
  nameTap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 40,
  },
  name: { flex: 1, fontWeight: '600' },
  controls: { flexDirection: 'row', gap: 4 },
  controlBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    borderStyle: 'dashed',
  },
});
