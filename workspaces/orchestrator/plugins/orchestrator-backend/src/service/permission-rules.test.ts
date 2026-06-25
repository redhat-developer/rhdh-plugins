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

import type { OrchestratorService } from './OrchestratorService';
import {
  bindOrchestratorService,
  fetchWorkflowResources,
  isWorkflowId,
  orchestratorPermissionRules,
  WorkflowIdRuleParams,
} from './permission-rules';

describe('permission-rules', () => {
  describe('isWorkflowId', () => {
    it('should return true when workflow ID is in the allowed list', () => {
      const resource = { workflowId: 'approval-workflow-123' };
      const params: WorkflowIdRuleParams = {
        workflowIds: ['approval-workflow-123', 'other-workflow'],
      };

      const result = isWorkflowId.apply(resource, params);

      expect(result).toBe(true);
    });

    it('should return false when workflow ID is not in the allowed list', () => {
      const resource = { workflowId: 'approval-workflow-123' };
      const params: WorkflowIdRuleParams = {
        workflowIds: ['different-workflow-456', 'another-workflow'],
      };

      const result = isWorkflowId.apply(resource, params);

      expect(result).toBe(false);
    });

    it('should have correct metadata', () => {
      expect(isWorkflowId.name).toBe('IS_ALLOWED_WORKFLOW_ID');
      expect(isWorkflowId.description).toBe(
        'Allow workflows matching the specified workflow IDs',
      );
      expect(isWorkflowId.resourceType).toBe('orchestrator-workflow');
    });
  });

  describe('orchestratorPermissionRules', () => {
    it('should export isWorkflowId rule', () => {
      expect(orchestratorPermissionRules).toContain(isWorkflowId);
    });

    it('should have exactly one rule', () => {
      expect(orchestratorPermissionRules).toHaveLength(1);
    });
  });

  describe('fetchWorkflowResources', () => {
    const mockOrchestratorService = {
      fetchWorkflowOverview: jest.fn().mockResolvedValue({ id: 'workflow-1' }),
    } as unknown as OrchestratorService;

    beforeEach(() => {
      bindOrchestratorService(mockOrchestratorService);
      jest.clearAllMocks();
    });

    it('should fetch workflow overviews for resource refs', async () => {
      const resources = await fetchWorkflowResources([
        'workflow-1',
        'workflow-2',
      ]);

      expect(
        mockOrchestratorService.fetchWorkflowOverview,
      ).toHaveBeenCalledTimes(2);
      expect(
        mockOrchestratorService.fetchWorkflowOverview,
      ).toHaveBeenCalledWith({
        definitionId: 'workflow-1',
      });
      expect(
        mockOrchestratorService.fetchWorkflowOverview,
      ).toHaveBeenCalledWith({
        definitionId: 'workflow-2',
      });
      expect(resources).toEqual([{ id: 'workflow-1' }, { id: 'workflow-1' }]);
    });

    it('should throw when orchestrator service is not initialized', () => {
      bindOrchestratorService(undefined as unknown as OrchestratorService);

      expect(() => fetchWorkflowResources(['workflow-1'])).toThrow(
        'Orchestrator service is not initialized',
      );
    });
  });
});
