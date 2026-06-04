const primary = '#0D7A4A';
const primaryDark = '#065A36';
const accent = '#F5A623';

export default {
  light: {
    text: '#1A1A1A',
    textSecondary: '#666',
    background: '#F8FAF9',
    card: '#FFFFFF',
    tint: primary,
    accent,
    tabIconDefault: '#999',
    tabIconSelected: primary,
    border: '#E5ECE8',
    error: '#D32F2F',
    success: '#0D7A4A',
  },
  dark: {
    text: '#F5F5F5',
    textSecondary: '#AAA',
    background: '#0F1412',
    card: '#1A2420',
    tint: '#2ECC71',
    accent,
    tabIconDefault: '#666',
    tabIconSelected: '#2ECC71',
    border: '#2A3A32',
    error: '#EF5350',
    success: '#2ECC71',
  },
};

export const brand = { primary, primaryDark, accent };
