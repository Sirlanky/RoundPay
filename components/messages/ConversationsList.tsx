import { useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { MessageContactLabelSheet } from '@/components/messages/MessageContactLabelSheet';
import { Card, Input, Text } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { useMessagesContext } from '@/contexts/MessagesContext';
import { formatRelativeTime } from '@/lib/format';
import { conversationDisplayName } from '@/lib/message-labels';
import { spacing, useThemeTokens } from '@/theme';

export function ConversationsList() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useThemeTokens();
  const { conversations, loading, labels, setContactLabel, removeContactLabel } = useMessagesContext();
  const [query, setQuery] = useState('');
  const [labelTarget, setLabelTarget] = useState<{
    contactId: string;
    profileName: string;
  } | null>(null);
  const [labelSaving, setLabelSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const display = conversationDisplayName(c, labels, t('messages.memberFallback'));
      if (display.toLowerCase().includes(q)) return true;
      if ((c.fullName ?? '').toLowerCase().includes(q)) return true;
      if (c.lastBody.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [conversations, labels, query, t]);

  const openLabelSheet = (contactId: string, profileName: string) => {
    setLabelTarget({ contactId, profileName });
  };

  const closeLabelSheet = () => {
    if (!labelSaving) setLabelTarget(null);
  };

  const handleSaveLabel = async (label: string) => {
    if (!labelTarget) return;
    setLabelSaving(true);
    try {
      await setContactLabel(labelTarget.contactId, label);
      setLabelTarget(null);
    } finally {
      setLabelSaving(false);
    }
  };

  const handleClearLabel = async () => {
    if (!labelTarget) return;
    setLabelSaving(true);
    try {
      await removeContactLabel(labelTarget.contactId);
      setLabelTarget(null);
    } finally {
      setLabelSaving(false);
    }
  };

  if (loading && !conversations.length) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <>
      {conversations.length > 0 ? (
        <>
          <Input
            variant="search"
            placeholder={t('messages.searchPlaceholder')}
            value={query}
            onChangeText={setQuery}
            containerStyle={styles.search}
          />
          <Text variant="caption" color="muted" style={styles.searchHint}>
            {t('messages.renameHint')}
          </Text>
        </>
      ) : null}

      {!conversations.length ? (
        <EmptyState title={t('messages.emptyTitle')} message={t('messages.emptyMessage')} />
      ) : filtered.length === 0 ? (
        <Text variant="bodySmall" color="secondary" style={styles.noMatch}>
          {t('messages.searchEmpty')}
        </Text>
      ) : (
        <View style={styles.list}>
          {filtered.map((c) => {
            const profileName = c.fullName?.trim() || t('messages.memberFallback');
            const name = conversationDisplayName(c, labels, t('messages.memberFallback'));
            const hasCustomLabel = Boolean(labels[c.otherUserId]?.trim());
            const isMine = c.lastSenderId === user?.id;
            const unread = c.unreadCount > 0;
            return (
              <Pressable
                key={c.otherUserId}
                onPress={() => router.push(`/messages/${c.otherUserId}` as Href)}
                onLongPress={() => openLabelSheet(c.otherUserId, profileName)}
                delayLongPress={400}
                style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
                <Card variant="standard" style={styles.row}>
                  <Avatar name={name} uri={c.avatarUrl} size={48} />
                  <View style={styles.body}>
                    <View style={styles.titleRow}>
                      <View style={styles.nameCol}>
                        <Text variant="bodyMedium" style={styles.name} numberOfLines={1}>
                          {name}
                        </Text>
                        {hasCustomLabel ? (
                          <Text variant="caption" color="muted" numberOfLines={1}>
                            {profileName}
                          </Text>
                        ) : null}
                      </View>
                      <Text variant="caption" color="muted">
                        {formatRelativeTime(c.lastAt)}
                      </Text>
                    </View>
                    <Text
                      variant="bodySmall"
                      color={unread ? 'accent' : 'secondary'}
                      numberOfLines={1}
                      style={unread ? styles.unreadPreview : undefined}>
                      {isMine ? `${t('messages.youPrefix')} ` : ''}
                      {c.lastBody}
                    </Text>
                  </View>
                  {unread ? (
                    <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                      <Text variant="caption" style={{ ...styles.badgeText, color: colors.textInverse }}>
                        {c.unreadCount}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.dotSpacer} />
                  )}
                </Card>
              </Pressable>
            );
          })}
        </View>
      )}

      <MessageContactLabelSheet
        visible={labelTarget !== null}
        profileName={labelTarget?.profileName ?? ''}
        currentLabel={labelTarget ? labels[labelTarget.contactId] ?? '' : ''}
        saving={labelSaving}
        onSave={handleSaveLabel}
        onClear={handleClearLabel}
        onClose={closeLabelSheet}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl },
  search: { marginBottom: spacing.xs },
  searchHint: { marginBottom: spacing.md, lineHeight: 16 },
  noMatch: { marginTop: spacing.md, lineHeight: 20 },
  list: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  body: { flex: 1, gap: 2, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  nameCol: { flex: 1, minWidth: 0 },
  name: { fontWeight: '700' },
  unreadPreview: { fontWeight: '700' },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontWeight: '800' },
  dotSpacer: { width: 22, height: 22 },
});
