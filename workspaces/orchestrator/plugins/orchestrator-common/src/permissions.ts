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
import { createPermission } from '@backstage/plugin-permission-common';

export const orchestratorWorkflowInstancesReadPermission = createPermission({
  name: 'orchestrator.workflowInstances.read',
  attributes: {
    action: 'read',
  },
});

export const orchestratorWorkflowInstanceReadPermission = createPermission({
  name: 'orchestrator.workflowInstance.read',
  attributes: {
    action: 'read',
  },
});

/**
 * @param workflowId Mind this is workflowId and not instanceId
 */
export const orchestratorWorkflowInstanceReadSpecificPermission = (
  workflowId: string,
) =>
  createPermission({
    name: `orchestrator.workflowInstance.read.${workflowId}`,
    attributes: {
      action: 'read',
    },
  });

export const orchestratorWorkflowsReadPermission = createPermission({
  name: 'orchestrator.workflows.read',
  attributes: {
    action: 'read',
  },
});

export const orchestratorWorkflowReadPermission = createPermission({
  name: 'orchestrator.workflow.read',
  attributes: {
    action: 'read',
  },
});

export const orchestratorWorkflowReadSpecificPermission = (
  workflowId: string,
) =>
  createPermission({
    name: `orchestrator.workflow.read.${workflowId}`,
    attributes: {
      action: 'read',
    },
  });

export const orchestratorWorkflowExecutePermission = createPermission({
  name: 'orchestrator.workflow.execute',
  attributes: {},
});

export const orchestratorWorkflowExecuteSpecificPermission = (
  workflowId: string,
) =>
  createPermission({
    name: `orchestrator.workflow.execute.${workflowId}`,
    attributes: {},
  });

export const orchestratorWorkflowInstanceAbortPermission = createPermission({
  name: 'orchestrator.workflowInstance.abort',
  attributes: {},
});

/**
 * @param workflowId Mind this is workflowId and not instanceId
 */
export const orchestratorWorkflowInstanceAbortSpecificPermission = (
  workflowId: string,
) =>
  createPermission({
    name: `orchestrator.workflowInstance.abort.${workflowId}`,
    attributes: {},
  });

export const orchestratorPermissions = [
  orchestratorWorkflowReadPermission,
  orchestratorWorkflowExecutePermission,
  orchestratorWorkflowInstancesReadPermission,
  orchestratorWorkflowInstanceReadPermission,
  orchestratorWorkflowInstanceAbortPermission,
];
