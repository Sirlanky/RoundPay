import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GroupCard } from './GroupCard';
import type { GroupBucket } from '@/lib/group-sections';
import { groupBucketHint, groupBucketLabel } from '@/lib/group-sections';
import type { AjoGroup } from '@/lib/types';
import { primaryAlpha, radius, spacing, useThemeTokens } from '@/theme';

interface Props {
  visible: boolean;
  bucket: GroupBucket;
  groups: AjoGroup[];
  onClose: () => void;
}

export function GroupBucketModal({ visible, bucket, groups, onClose }: Props) {
  const { colors, scheme } = useThemeTokens();
  const insets = useSafeAreaInsets();
  const isHistory = bucket === 'completed';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: Math.max(insets.bottom, spacing.md),
            },
          ]}
          onPress={(e) => e.stopPropagation()}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[styles.title, { color: colors.textPrimary }]}>{groupBucketLabel(bucket)}</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>{groupBucketHint(bucket)}</Text>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}>
            {groups.length === 0 ? (
              <Text style={[styles.empty, { color: colors.textSecondary }]}>No groups here yet.</Text>
            ) : (
              groups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  variant={isHistory ? 'history' : 'default'}
                  onNavigate={onClose}
                />
              ))
            )}
          </ScrollView>

          <Pressable
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: primaryAlpha(scheme, 16) }]}>
            <Text style={[styles.closeText, { color: colors.primary }]}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    maxHeight: '78%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: { fontSize: 20, fontWeight: '700' },
  hint: { fontSize: 13, lineHeight: 18, marginTop: 4, marginBottom: spacing.sm },
  list: { flexGrow: 0 },
  listContent: { paddingBottom: spacing.sm },
  empty: { fontSize: 14, textAlign: 'center', paddingVertical: spacing.lg },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  closeText: { fontSize: 16, fontWeight: '600' },
});
