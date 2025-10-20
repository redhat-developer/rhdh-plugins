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
  ProcessInstanceStatusDTO,
  WorkflowOverviewDTO,
} from '@redhat/backstage-plugin-orchestrator-common';

import WorkflowOverviewFormatter, {
  FormattedWorkflowOverview,
} from './WorkflowOverviewFormatter';

describe('WorkflowOverviewAdapter', () => {
  it('should adapt WorkflowOverview to AdaptedWorkflowOverview', () => {
    // Mock data for testing
    const mockWorkflowOverview: WorkflowOverviewDTO = {
      workflowId: '123',
      name: 'Sample Workflow',
      lastTriggeredMs: 1697276096000,
      lastRunStatus: ProcessInstanceStatusDTO.Completed,
      description: 'Sample description',
      format: 'yaml',
    };

    const adaptedData: FormattedWorkflowOverview =
      WorkflowOverviewFormatter.format(mockWorkflowOverview);

    expect(adaptedData.id).toBe(mockWorkflowOverview.workflowId);
    expect(adaptedData.name).toBe(mockWorkflowOverview.name);
    expect(adaptedData.lastTriggered).toBe(
      new Date(mockWorkflowOverview.lastTriggeredMs!).toLocaleString(),
    );
    expect(adaptedData.lastRunStatus).toBe(mockWorkflowOverview.lastRunStatus);
    expect(adaptedData.description).toBe(mockWorkflowOverview.description);
    expect(adaptedData.format).toBe('yaml'); // Adjust based on your expected value
  });

  it('should have --- for undefined data', () => {
    // Mock data for testing
    const mockWorkflowOverview: WorkflowOverviewDTO = {
      workflowId: '123',
      format: 'yaml',
    };
    const adaptedData: FormattedWorkflowOverview =
      WorkflowOverviewFormatter.format(mockWorkflowOverview);

    expect(adaptedData.id).toBe(mockWorkflowOverview.workflowId);
    expect(adaptedData.name).toBe('---');
    expect(adaptedData.lastTriggered).toBe('---');
    expect(adaptedData.lastRunStatus).toBe('---');
    expect(adaptedData.description).toBe('---');
    expect(adaptedData.format).toBe('yaml');
  });
});
