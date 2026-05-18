import type { AgentLifecycleStage } from '@red-hat-developer-hub/backstage-plugin-augment-common';

export interface LifecycleTransition {
  target: AgentLifecycleStage;
  label: string;
  action: 'promote' | 'demote';
  variant: 'outlined' | 'contained';
  color: 'inherit' | 'primary' | 'success';
  iconType: 'promote' | 'demote';
}

const LIFECYCLE_TRANSITION_MAP: Record<string, LifecycleTransition> = {
  draft: {
    target: 'review',
    label: 'Submit for Review',
    action: 'promote',
    variant: 'contained',
    color: 'primary',
    iconType: 'promote',
  },
  review: {
    target: 'staging',
    label: 'Approve to Staging',
    action: 'promote',
    variant: 'contained',
    color: 'primary',
    iconType: 'promote',
  },
  staging: {
    target: 'production',
    label: 'Promote to Production',
    action: 'promote',
    variant: 'contained',
    color: 'success',
    iconType: 'promote',
  },
  production: {
    target: 'staging',
    label: 'Rollback to Staging',
    action: 'demote',
    variant: 'outlined',
    color: 'inherit',
    iconType: 'demote',
  },
  retired: {
    target: 'draft',
    label: 'Reactivate',
    action: 'demote',
    variant: 'outlined',
    color: 'inherit',
    iconType: 'demote',
  },
};

export function getLifecycleTransition(
  stage: string | null | undefined,
): LifecycleTransition {
  return (
    LIFECYCLE_TRANSITION_MAP[stage ?? 'draft'] ?? LIFECYCLE_TRANSITION_MAP.draft
  );
}

export function getLifecycleStep(lifecycleStage?: string | null): number {
  if (lifecycleStage === 'retired') return 4;
  if (lifecycleStage === 'production' || lifecycleStage === 'deployed')
    return 3;
  if (lifecycleStage === 'staging') return 2;
  if (lifecycleStage === 'review' || lifecycleStage === 'registered') return 1;
  return 0;
}

export const LIFECYCLE_STEP_LABELS = [
  'Draft',
  'Review',
  'Staging',
  'Production',
  'Retired',
] as const;
