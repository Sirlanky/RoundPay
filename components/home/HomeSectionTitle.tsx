import { Text } from '@/components/ui/Text';

interface Props {
  title: string;
}

/** @deprecated Prefer `<Section title="..." />` from `@/components/ui`. */
export function HomeSectionTitle({ title }: Props) {
  return (
    <Text variant="headingSmall" style={{ marginBottom: 8 }}>
      {title}
    </Text>
  );
}
