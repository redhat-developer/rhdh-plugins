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

import React, { useCallback, useMemo } from 'react';

import { useEntity } from '@backstage/plugin-catalog-react';

import { WorkflowOverviewDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { WorkflowsTabContent } from '../components/WorkflowsTabContent';
import { WorkflowIdsAnnotation } from '../constants';

export const WorkflowsEntityContent = () => {
  const { entity } = useEntity();
  const workflowIds: string[] = useMemo(
    () =>
      (entity.metadata?.annotations?.[WorkflowIdsAnnotation] || '')
        .split(',')
        .map(id => id.trim())
        .filter(Boolean),
    [entity],
  );

  const filterWorkflows = useCallback(
    (workflow: WorkflowOverviewDTO) => {
      return workflowIds.includes(workflow.workflowId);
    },
    [workflowIds],
  );

  return <WorkflowsTabContent filterWorkflows={filterWorkflows} />;
};
