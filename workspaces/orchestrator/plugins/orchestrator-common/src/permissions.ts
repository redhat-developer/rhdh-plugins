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

import { createPermission } from '@backstage/plugin-permission-common';

export const orchestratorWorkflowPermission = createPermission({
  name: 'orchestrator.workflow',
  attributes: {
    action: 'read',
  },
});

export const orchestratorWorkflowSpecificPermission = (workflowId: string) =>
  createPermission({
    name: `orchestrator.workflow.${workflowId}`,
    attributes: {
      action: 'read',
    },
  });

export const orchestratorWorkflowUsePermission = createPermission({
  name: 'orchestrator.workflow.use',
  attributes: {
    action: 'update',
  },
});

export const orchestratorWorkflowUseSpecificPermission = (workflowId: string) =>
  createPermission({
    name: `orchestrator.workflow.use.${workflowId}`,
    attributes: {
      action: 'update',
    },
  });

export const orchestratorAdminViewPermission = createPermission({
  name: 'orchestrator.workflowAdminView',
  attributes: {
    action: 'read',
  },
});

export const orchestratorInstanceAdminViewPermission = createPermission({
  name: 'orchestrator.instanceAdminView',
  attributes: {
    action: 'read',
  },
});

export const orchestratorPermissions = [
  orchestratorWorkflowPermission,
  orchestratorWorkflowUsePermission,
  orchestratorAdminViewPermission,
  orchestratorInstanceAdminViewPermission,
];
