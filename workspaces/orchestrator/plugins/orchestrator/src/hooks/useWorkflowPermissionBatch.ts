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

import {
  BasicPermission,
  ResourcePermission,
} from '@backstage/plugin-permission-common';

import { WorkflowOverviewDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { usePermissionArray } from './usePermissionArray';
import { useResourcePermissionBatch } from './useResourcePermissionBatch';

export const useWorkflowPermissionBatch = (
  items: WorkflowOverviewDTO[],
  resourcePermission: ResourcePermission,
  // @deprecated Remove legacySpecificPermissionFactory in next release
  legacySpecificPermissionFactory: (workflowId: string) => BasicPermission,
): { allowed: boolean[]; loading: boolean } => {
  const workflowIds = items.map(item => item.workflowId);

  const resource = useResourcePermissionBatch(resourcePermission, workflowIds);
  // @deprecated Remove this legacy fallback block in next release
  const legacy = usePermissionArray(
    workflowIds.map(legacySpecificPermissionFactory),
  );

  return {
    loading: resource.loading || legacy.loading,
    allowed: items.map(
      (_, idx) => resource.allowed[idx] || legacy.allowed[idx],
    ),
  };
};
