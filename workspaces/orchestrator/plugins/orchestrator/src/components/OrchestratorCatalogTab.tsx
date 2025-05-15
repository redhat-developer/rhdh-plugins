import React from 'react';

import { useEntity } from '@backstage/plugin-catalog-react';

import { WorkflowsTabContent } from './OrchestratorPage/WorkflowsTabContent';

export const IsOrchestratorCatalogTabAvailable = () => {
  const { entity } = useEntity();
  return Boolean(entity.metadata.annotations?.['orchestrator.io/workflows']);
};

export const OrchestratorCatalogTab = () => {
  const { entity } = useEntity();

  const rawAnnotation =
    entity.metadata.annotations?.['orchestrator.io/workflows'];

  let workflowsId: string[] = [];

  if (rawAnnotation) {
    workflowsId = JSON.parse(rawAnnotation);
  }

  return <WorkflowsTabContent workflowsArray={workflowsId} />;
};
