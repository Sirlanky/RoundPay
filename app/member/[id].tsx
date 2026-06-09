import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { Button, Card, StatusBadge, Text } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { formatDate } from '@/lib/format';
import {
  fetchPublicProfile,
  fetchSharedGroups,
  type PublicProfile,
  type SharedGroup,
} from '@/lib/public-profile';
import { resolveRouteParam } from '@/lib/route-params';
import { primaryAlpha, spacing, useThemeTokens } from '@/theme';

function displayName(p: PublicProfile): string {
  const full = p.full_name?.trim();
  if (full) return full;
  const composed = [p.first_name, p.last_name].filter(Boolean).join(' ').trim();
  if (composed) return composed;
  return 'Member';
}

export default function MemberProfileScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const userId = resolveRouteParam(params.id) ?? '';
  const { user } = useAuth();
  const { t, tp } = useTranslation();
  const router = useRouter();
  const { colors, scheme } = useThemeTokens();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [groups, setGroups] = useState<SharedGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const [p, g] = await Promise.all([fetchPublicProfile(userId), fetchSharedGroups(userId)]);
        if (!active) return;
        setProfile(p);
        setGroups(g);
        setNotFound(!p);
      } catch {
        if (!active) return;
        setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  const isSelf = !!user?.id && user.id === userId;
  const canMessage =
    !isSelf && groups.some((g) => g.status === 'active' || g.status === 'completed');

  if (loading) {
    return (
      <Screen contentStyle={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </Screen>
    );
  }

  if (notFound || !profile) {
    return (
      <Screen contentStyle={styles.content}>
        <EmptyState
          title="Profile unavailable"
          message="You can only view the profiles of people you share a savings group with."
        />
      </Screen>
    );
  }

  const name = displayName(profile);

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.hero}>
        <Avatar name={name} uri={profile.avatar_url} size={96} />
        <Text variant="headingMedium" style={styles.name}>
          {name}
          {isSelf ? ' (you)' : ''}
        </Text>
        {profile.created_at ? (
          <Text variant="bodySmall" color="secondary">
            Member since {formatDate(profile.created_at)}
          </Text>
        ) : null}
      </View>

      {canMessage ? (
        <Button title={t('messages.sendMessage')} onPress={() => router.push(`/messages/${userId}` as Href)} />
      ) : null}

      {profile.phone ? (
        <Card variant="standard" style={styles.contactCard}>
          <Pressable
            style={styles.contactRow}
            onPress={() => Linking.openURL(`tel:${profile.phone}`)}>
            <View style={[styles.contactIcon, { backgroundColor: primaryAlpha(scheme, 12) }]}>
              <Text variant="bodyMedium" color="accent" style={styles.contactIconText}>
                ☎
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="caption" color="secondary">
                Phone
              </Text>
              <Text variant="bodyMedium" style={styles.contactValue}>
                {profile.phone}
              </Text>
            </View>
          </Pressable>
        </Card>
      ) : null}

      <Text variant="bodySmall" color="secondary" style={styles.sectionLabel}>
        {tp(groups.length, 'plural.sharedGroups_one', 'plural.sharedGroups_other')}
      </Text>
      {groups.length ? (
        <Card variant="standard" style={styles.groupsCard}>
          {groups.map((g, i) => (
            <Pressable
              key={g.id}
              onPress={() => router.push(`/group/${g.id}` as Href)}
              style={({ pressed }) => [
                styles.groupRow,
                i < groups.length - 1 && {
                  borderBottomColor: colors.border,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                },
                { opacity: pressed ? 0.85 : 1 },
              ]}>
              <Text variant="bodyMedium" style={styles.groupName} numberOfLines={1}>
                {g.name}
              </Text>
              <StatusBadge status={g.status} />
            </Pressable>
          ))}
        </Card>
      ) : (
        <Text variant="bodySmall" color="muted" style={styles.noGroups}>
          {t('plural.noSharedGroups')}
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingTop: spacing.lg, paddingBottom: spacing.xl },
  hero: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.lg },
  name: { fontWeight: '800', marginTop: spacing.sm, textAlign: 'center' },
  contactCard: { marginTop: spacing.md, paddingVertical: spacing.sm },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactIconText: { fontSize: 18 },
  contactValue: { fontWeight: '600' },
  sectionLabel: { marginTop: spacing.lg, marginBottom: spacing.sm, fontWeight: '700' },
  groupsCard: { paddingVertical: spacing.xs },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  groupName: { flex: 1, fontWeight: '600' },
  noGroups: { marginTop: spacing.xs },
});
