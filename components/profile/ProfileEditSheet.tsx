import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '@/components/ui';
import { Input } from '@/components/Input';
import {
  PROFILE_GENDER_OPTIONS,
  type ProfileFormValues,
} from '@/lib/profile-form';
import type { ProfileGender } from '@/lib/types';
import { primaryAlpha, spacing, useThemeTokens } from '@/theme';

interface Props {
  visible: boolean;
  values: ProfileFormValues;
  saving: boolean;
  error?: string;
  onChange: (patch: Partial<ProfileFormValues>) => void;
  onSave: () => void;
  onClose: () => void;
}

export function ProfileEditSheet({
  visible,
  values,
  saving,
  error,
  onChange,
  onSave,
  onClose,
}: Props) {
  const { colors, scheme } = useThemeTokens();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.flex, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Edit profile</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Your legal name helps admins identify you in savings groups.
          </Text>

          {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

          <Input
            label="First name"
            value={values.firstName}
            onChangeText={(firstName) => onChange({ firstName })}
            placeholder="First name"
            autoCapitalize="words"
          />
          <Input
            label="Middle name"
            value={values.middleName}
            onChangeText={(middleName) => onChange({ middleName })}
            placeholder="Optional"
            autoCapitalize="words"
          />
          <Input
            label="Last name"
            value={values.lastName}
            onChangeText={(lastName) => onChange({ lastName })}
            placeholder="Last name"
            autoCapitalize="words"
          />
          <Input
            label="Email"
            value={values.email}
            onChangeText={(email) => onChange({ email })}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Input
            label="Phone"
            value={values.phone}
            onChangeText={(phone) => onChange({ phone })}
            placeholder="+234 800 000 0000"
            keyboardType="phone-pad"
          />
          <Input
            label="Date of birth"
            value={values.dateOfBirth}
            onChangeText={(dateOfBirth) => onChange({ dateOfBirth })}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
          />

          <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Gender</Text>
          <View style={styles.genderRow}>
            {PROFILE_GENDER_OPTIONS.map((option) => {
              const selected = values.gender === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => onChange({ gender: option.value as ProfileGender })}
                  style={[
                    styles.genderChip,
                    {
                      backgroundColor: selected ? primaryAlpha(scheme, 16) : colors.surface,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}>
                  <Text style={[styles.genderText, { color: selected ? colors.primary : colors.textPrimary }]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Button title="Save changes" onPress={onSave} loading={saving} />
          <Button title="Cancel" onPress={onClose} variant="secondary" style={styles.cancel} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xl },
  title: { fontSize: 22, fontWeight: '700', marginBottom: spacing.xs },
  hint: { fontSize: 14, lineHeight: 20, marginBottom: spacing.lg },
  error: { fontSize: 14, lineHeight: 20, marginBottom: spacing.md },
  fieldLabel: { fontSize: 14, fontWeight: '500', marginBottom: spacing.sm },
  genderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  genderChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  genderText: { fontSize: 14, fontWeight: '600' },
  cancel: { marginTop: spacing.sm },
});
