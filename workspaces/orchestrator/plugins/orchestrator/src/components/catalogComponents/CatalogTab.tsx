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
import { useEntity } from '@backstage/plugin-catalog-react';

import { WorkflowsTabContent } from '../OrchestratorPage/WorkflowsTabContent';

export const IsOrchestratorCatalogTabAvailable = () => {
  const { entity } = useEntity();
  return Boolean(entity.metadata.annotations?.['orchestrator.io/workflows']);
};

export const OrchestratorCatalogTab = () => {
  const { entity } = useEntity();

  const rawAnnotation =
    entity.metadata.annotations?.['orchestrator.io/workflows'];
  let annotatedWorkflowIds: string[] = [];

  try {
    const parsed = rawAnnotation && JSON.parse(rawAnnotation);
    if (Array.isArray(parsed)) {
      annotatedWorkflowIds = parsed;
    }
  } catch {
    annotatedWorkflowIds = [];
  }

  const kind = entity.kind;
  const namespace = entity.metadata.namespace ?? 'default';
  const name = entity.metadata.name;
  const targetEntity = `${kind}:${namespace}/${name}`.toLocaleLowerCase();

  return (
    <WorkflowsTabContent
      workflowsArray={annotatedWorkflowIds}
      targetEntity={targetEntity}
    />
  );
};
