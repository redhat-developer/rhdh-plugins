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
  orchestratorAdminViewPermission,
  orchestratorInstanceAdminViewPermission,
  orchestratorPermissions,
  orchestratorWorkflowPermission,
  orchestratorWorkflowSpecificPermission,
  orchestratorWorkflowUsePermission,
  orchestratorWorkflowUseSpecificPermission,
} from './permissions';

describe('orchestrator permissions', () => {
  it('exports the expected base permissions', () => {
    expect(orchestratorWorkflowPermission).toMatchObject({
      name: 'orchestrator.workflow',
      attributes: { action: 'read' },
    });

    expect(orchestratorWorkflowUsePermission).toMatchObject({
      name: 'orchestrator.workflow.use',
      attributes: { action: 'update' },
    });

    expect(orchestratorAdminViewPermission).toMatchObject({
      name: 'orchestrator.workflowAdminView',
      attributes: { action: 'read' },
    });

    expect(orchestratorInstanceAdminViewPermission).toMatchObject({
      name: 'orchestrator.instanceAdminView',
      attributes: { action: 'read' },
    });
  });

  it('builds workflow-specific read permission', () => {
    expect(orchestratorWorkflowSpecificPermission('my-workflow')).toMatchObject(
      {
        name: 'orchestrator.workflow.my-workflow',
        attributes: { action: 'read' },
      },
    );
  });

  it('builds workflow-specific use permission', () => {
    expect(
      orchestratorWorkflowUseSpecificPermission('my-workflow'),
    ).toMatchObject({
      name: 'orchestrator.workflow.use.my-workflow',
      attributes: { action: 'update' },
    });
  });

  it('includes all base permissions in orchestratorPermissions list', () => {
    expect(orchestratorPermissions).toEqual([
      orchestratorWorkflowPermission,
      orchestratorWorkflowUsePermission,
      orchestratorAdminViewPermission,
      orchestratorInstanceAdminViewPermission,
    ]);
  });
});
