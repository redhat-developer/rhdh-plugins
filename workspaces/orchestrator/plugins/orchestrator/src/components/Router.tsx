/*
 * Copyright 2024 The Backstage Authors
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
import React from 'react';
import { Route, Routes } from 'react-router-dom';

import {
  executeWorkflowRouteRef,
  workflowDefinitionsRouteRef,
  workflowInstanceRouteRef,
} from '../routes';
import { ExecuteWorkflowPage } from './ExecuteWorkflowPage/ExecuteWorkflowPage';
import { OrchestratorPage } from './OrchestratorPage';
import { WorkflowDefinitionViewerPage } from './WorkflowDefinitionViewerPage';
import { WorkflowInstancePage } from './WorkflowInstancePage';

export const Router = () => {
  return (
    <Routes>
      <Route path="/*" element={<OrchestratorPage />} />
      <Route
        path={workflowInstanceRouteRef.path}
        element={<WorkflowInstancePage />}
      />
      <Route
        path={workflowDefinitionsRouteRef.path}
        element={<WorkflowDefinitionViewerPage />}
      />
      <Route
        path={executeWorkflowRouteRef.path}
        element={<ExecuteWorkflowPage />}
      />
    </Routes>
  );
};
