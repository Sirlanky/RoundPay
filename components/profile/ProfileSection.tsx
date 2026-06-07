import { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { Card, Section } from '@/components/ui';

interface Props {
  title: string;
  children: ReactNode;
}

export function ProfileSection({ title, children }: Props) {
  return (
    <Section title={title} compact style={styles.wrap}>
      <Card variant="elevated" style={styles.card}>
        {children}
      </Card>
    </Section>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8 },
  card: { paddingVertical: 4, marginBottom: 16 },
});
