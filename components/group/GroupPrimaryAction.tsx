import { StyleSheet } from 'react-native';
import { Button, Card, Text } from '@/components/ui';
import { spacing } from '@/theme';

interface Props {
  title: string;
  subtitle?: string;
  buttonTitle: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  hint?: string;
}

/** Prominent round action — kept near the top so admins don't scroll to the bottom. */
export function GroupPrimaryAction({
  title,
  subtitle,
  buttonTitle,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  hint,
}: Props) {
  return (
    <Card variant="summary" style={styles.card}>
      <Text variant="headingSmall">{title}</Text>
      {subtitle ? (
        <Text variant="bodySmall" color="secondary" style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
      <Button
        title={buttonTitle}
        onPress={onPress}
        loading={loading}
        disabled={disabled}
        variant={variant}
        style={styles.btn}
      />
      {hint ? (
        <Text variant="caption" color="secondary" style={styles.hint}>
          {hint}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  subtitle: { marginTop: 4, lineHeight: 18 },
  btn: { marginTop: spacing.md, marginBottom: 0 },
  hint: { marginTop: spacing.sm, textAlign: 'center', lineHeight: 16 },
});
