/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
    target: 'pending',
    label: 'Submit for Review',
    action: 'promote',
    variant: 'contained',
    color: 'primary',
    iconType: 'promote',
  },
  pending: {
    target: 'published',
    label: 'Approve and Publish',
    action: 'promote',
    variant: 'contained',
    color: 'success',
    iconType: 'promote',
  },
  published: {
    target: 'pending',
    label: 'Request Unpublish',
    action: 'demote',
    variant: 'outlined',
    color: 'inherit',
    iconType: 'demote',
  },
  archived: {
    target: 'draft',
    label: 'Restore',
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
  if (lifecycleStage === 'archived') return 3;
  if (lifecycleStage === 'published' || lifecycleStage === 'deployed') return 2;
  if (lifecycleStage === 'pending' || lifecycleStage === 'registered') return 1;
  return 0;
}

export const LIFECYCLE_STEP_LABELS = [
  'Draft',
  'Pending',
  'Published',
  'Archived',
] as const;
