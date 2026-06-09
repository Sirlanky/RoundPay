import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlatformIcon } from '@/components/navigation/PlatformIcon';
import { MessageContactLabelSheet } from '@/components/messages/MessageContactLabelSheet';
import { Text } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { useMessagesContext } from '@/contexts/MessagesContext';
import { useDirectMessages } from '@/hooks/useDirectMessages';
import { formatTime } from '@/lib/format';
import { contactDisplayName } from '@/lib/message-labels';
import { isMessagingNotInstalled, sendMessage } from '@/lib/messages';
import { fetchPublicProfile } from '@/lib/public-profile';
import { resolveRouteParam } from '@/lib/route-params';
import { spacing, useThemeTokens } from '@/theme';

export default function ChatThreadScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const otherUserId = resolveRouteParam(params.id) ?? '';
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { colors } = useThemeTokens();
  const { labels, setContactLabel, removeContactLabel } = useMessagesContext();

  const { messages, loading, refetch } = useDirectMessages(user?.id, otherUserId);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [profileName, setProfileName] = useState(t('messages.memberFallback'));
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [labelOpen, setLabelOpen] = useState(false);
  const [labelSaving, setLabelSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!otherUserId) return;
      try {
        const p = await fetchPublicProfile(otherUserId);
        if (!active || !p) return;
        const name = p.full_name?.trim() || [p.first_name, p.last_name].filter(Boolean).join(' ').trim();
        if (name) setProfileName(name);
      } catch {
        /* keep default */
      }
    })();
    return () => {
      active = false;
    };
  }, [otherUserId, t]);

  const displayName = contactDisplayName(
    otherUserId,
    profileName,
    labels,
    t('messages.memberFallback')
  );
  const customLabel = labels[otherUserId]?.trim();

  const openLabelSheet = useCallback(() => setLabelOpen(true), []);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: displayName,
      headerRight: () => (
        <Pressable
          hitSlop={12}
          onPress={openLabelSheet}
          accessibilityRole="button"
          accessibilityLabel={t('messages.saveNameAction')}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, marginRight: 4 })}>
          <PlatformIcon
            name={{ ios: 'pencil.circle.fill', android: 'edit', web: 'edit' }}
            color={colors.primary}
            size={22}
          />
        </Pressable>
      ),
    });
  }, [navigation, displayName, openLabelSheet, colors.primary, t]);

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setErrorBanner(null);
    try {
      await sendMessage(otherUserId, body);
      setDraft('');
      await refetch();
    } catch (e) {
      if (isMessagingNotInstalled(e)) {
        setErrorBanner(t('messages.notInstalled'));
      } else {
        setErrorBanner(e instanceof Error ? e.message : t('messages.sendFailed'));
      }
    } finally {
      setSending(false);
    }
  };

  const handleSaveLabel = async (label: string) => {
    setLabelSaving(true);
    try {
      await setContactLabel(otherUserId, label);
      setLabelOpen(false);
    } finally {
      setLabelSaving(false);
    }
  };

  const handleClearLabel = async () => {
    setLabelSaving(true);
    try {
      await removeContactLabel(otherUserId);
      setLabelOpen(false);
    } finally {
      setLabelSaving(false);
    }
  };

  const ordered = [...messages].reverse();

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        {customLabel ? (
          <View style={[styles.nameBanner, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <Text variant="caption" color="secondary" numberOfLines={1}>
              {t('messages.profileNameLine', { name: profileName })}
            </Text>
          </View>
        ) : null}

        {loading && !messages.length ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <FlatList
            data={ordered}
            inverted
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text variant="bodySmall" color="muted" style={styles.emptyText}>
                  {t('messages.threadEmpty', { name: displayName })}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const mine = item.sender_id === user?.id;
              return (
                <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
                  <View
                    style={[
                      styles.bubble,
                      mine
                        ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
                        : {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                            borderWidth: StyleSheet.hairlineWidth,
                            borderBottomLeftRadius: 4,
                          },
                    ]}>
                    <Text
                      variant="bodyMedium"
                      style={{ color: mine ? colors.textInverse : colors.textPrimary }}>
                      {item.body}
                    </Text>
                    <Text
                      variant="caption"
                      style={{
                        ...styles.time,
                        color: mine ? colors.textInverse : colors.textMuted,
                        opacity: mine ? 0.8 : 1,
                      }}>
                      {formatTime(item.created_at)}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        {errorBanner ? (
          <View style={[styles.errorBanner, { backgroundColor: colors.surface }]}>
            <Text variant="caption" color="error">
              {errorBanner}
            </Text>
          </View>
        ) : null}

        <View style={[styles.inputBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary },
            ]}
            placeholder={t('messages.inputPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={draft}
            onChangeText={setDraft}
            multiline
            editable={!sending}
          />
          <Pressable
            onPress={handleSend}
            disabled={!draft.trim() || sending}
            style={[
              styles.sendBtn,
              { backgroundColor: colors.primary, opacity: !draft.trim() || sending ? 0.5 : 1 },
            ]}>
            {sending ? (
              <ActivityIndicator color={colors.textInverse} size="small" />
            ) : (
              <Text variant="bodyMedium" style={{ ...styles.sendText, color: colors.textInverse }}>
                {t('messages.send')}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <MessageContactLabelSheet
        visible={labelOpen}
        profileName={profileName}
        currentLabel={customLabel ?? ''}
        saving={labelSaving}
        onSave={handleSaveLabel}
        onClear={handleClearLabel}
        onClose={() => {
          if (!labelSaving) setLabelOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  nameBanner: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  listContent: { padding: spacing.md, flexGrow: 1 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', transform: [{ scaleY: -1 }] },
  emptyText: { textAlign: 'center' },
  bubbleRow: { marginBottom: spacing.sm, flexDirection: 'row' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 18,
  },
  time: { marginTop: 4, fontSize: 10, alignSelf: 'flex-end' },
  errorBanner: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
  },
  sendBtn: {
    height: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { fontWeight: '700' },
});
