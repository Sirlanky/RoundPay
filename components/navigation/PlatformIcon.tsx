import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolView } from 'expo-symbols';
import { Platform } from 'react-native';

export type PlatformIconName = { ios: string; android: string; web: string };

interface Props {
  name: PlatformIconName;
  size?: number;
  color: string;
}

export function PlatformIcon({ name, size = 24, color }: Props) {
  if (!name?.ios) return null;

  if (Platform.OS === 'ios') {
    return <SymbolView name={name.ios as never} tintColor={color} size={size} />;
  }

  const glyph = Platform.OS === 'android' ? name.android : name.web;
  return <MaterialIcons name={glyph as keyof typeof MaterialIcons.glyphMap} size={size} color={color} />;
}
