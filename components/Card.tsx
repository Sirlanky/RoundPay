import { ReactNode } from 'react';
import { ViewStyle } from 'react-native';
import { Card as UICard, type CardVariant } from '@/components/ui/Card';

interface Props {
  children: ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  variant?: CardVariant;
}

/** @deprecated Prefer `@/components/ui/Card`. */
export function Card({ children, style, elevated = false, variant }: Props) {
  const resolved = variant ?? (elevated ? 'elevated' : 'standard');
  return (
    <UICard variant={resolved} style={style}>
      {children}
    </UICard>
  );
}
