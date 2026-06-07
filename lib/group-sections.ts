import type { AjoGroup } from './types';

export type GroupBucket = 'draft' | 'active' | 'completed';

export interface CategorizedGroups {
  draft: AjoGroup[];
  active: AjoGroup[];
  completed: AjoGroup[];
}

export function categorizeGroups(groups: AjoGroup[]): CategorizedGroups {
  const draft: AjoGroup[] = [];
  const active: AjoGroup[] = [];
  const completed: AjoGroup[] = [];

  for (const group of groups) {
    if (group.status === 'draft') draft.push(group);
    else if (group.status === 'completed') completed.push(group);
    else active.push(group);
  }

  return { draft, active, completed };
}

export function groupBucketLabel(bucket: GroupBucket): string {
  switch (bucket) {
    case 'draft':
      return 'Setting up';
    case 'active':
      return 'Active';
    case 'completed':
      return 'History';
  }
}

export function groupBucketHint(bucket: GroupBucket): string {
  switch (bucket) {
    case 'draft':
      return 'Invite members and start when the roster is full.';
    case 'active':
      return 'Ongoing Ajos — payments and payouts happen here.';
    case 'completed':
      return 'Finished Ajos — everyone has collected.';
  }
}
