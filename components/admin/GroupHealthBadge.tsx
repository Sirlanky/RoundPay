import { Badge } from '@/components/ui';
import type { GroupHealth } from '@/lib/admin/admin-dashboard';

interface Props {
  health: GroupHealth;
}

const VARIANT: Record<GroupHealth, 'success' | 'warning' | 'error'> = {
  healthy: 'success',
  attention: 'warning',
  critical: 'error',
};

const LABEL: Record<GroupHealth, string> = {
  healthy: 'Healthy',
  attention: 'Needs attention',
  critical: 'Overdue',
};

export function GroupHealthBadge({ health }: Props) {
  return <Badge label={LABEL[health]} variant={VARIANT[health]} />;
}
