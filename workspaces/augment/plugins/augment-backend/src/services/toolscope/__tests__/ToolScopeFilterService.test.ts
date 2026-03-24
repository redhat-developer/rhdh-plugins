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

import type { LoggerService } from '@backstage/backend-plugin-api';
import {
  ToolScopeFilterService,
  createToolScopeService,
} from '../ToolScopeFilterService';
import type { ToolDescriptor } from '../types';
import { createMockLogger } from '../../../test-utils/mocks';

function tool(
  serverId: string,
  name: string,
  description: string,
): ToolDescriptor {
  return { serverId, name, description };
}

describe('ToolScopeFilterService', () => {
  let mockLogger: ReturnType<typeof createMockLogger>;
  let service: ToolScopeFilterService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger = createMockLogger();
    service = new ToolScopeFilterService(
      mockLogger as unknown as LoggerService,
    );
  });

  describe('updateIndex', () => {
    it('logs index update summary', () => {
      const tools = [
        tool('ocp', 'list_pods', 'List all pods in a namespace'),
        tool('ocp', 'get_logs', 'Get container logs'),
        tool('github', 'create_issue', 'Create a GitHub issue'),
      ];

      service.updateIndex(tools);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('3 tools across 2 servers'),
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('3 changed'),
      );
    });

    it('detects unchanged tools via fingerprinting', () => {
      const tools = [tool('ocp', 'list_pods', 'List all pods in a namespace')];

      service.updateIndex(tools);
      service.updateIndex(tools);

      const secondCall = (mockLogger.info as jest.Mock).mock.calls.find(
        (c: string[]) => typeof c[0] === 'string' && c[0].includes('0 changed'),
      );
      expect(secondCall).toBeTruthy();
    });

    it('detects changed tools when descriptions update', () => {
      service.updateIndex([tool('ocp', 'list_pods', 'List all pods')]);

      service.updateIndex([
        tool('ocp', 'list_pods', 'List all pods in all namespaces'),
      ]);

      const calls = (mockLogger.info as jest.Mock).mock.calls;
      const secondUpdate = calls.find(
        (c: string[]) =>
          typeof c[0] === 'string' &&
          c[0].includes('1 changed') &&
          c[0].includes('0 removed'),
      );
      expect(secondUpdate).toBeTruthy();
    });

    it('detects removed tools', () => {
      service.updateIndex([
        tool('ocp', 'list_pods', 'List all pods'),
        tool('ocp', 'get_logs', 'Get container logs'),
      ]);

      service.updateIndex([tool('ocp', 'list_pods', 'List all pods')]);

      const calls = (mockLogger.info as jest.Mock).mock.calls;
      const hasRemoved = calls.some(
        (c: string[]) => typeof c[0] === 'string' && c[0].includes('1 removed'),
      );
      expect(hasRemoved).toBe(true);
    });
  });

  describe('filterTools', () => {
    const tools = [
      tool('ocp', 'list_pods', 'List all kubernetes pods in the cluster'),
      tool('ocp', 'get_logs', 'Get container logs from a running pod'),
      tool('ocp', 'scale_deployment', 'Scale deployment replicas up or down'),
      tool('github', 'create_issue', 'Create a new issue on GitHub'),
      tool('github', 'search_repos', 'Search GitHub repositories'),
      tool('aws', 'list_instances', 'List EC2 instances in AWS account'),
    ];

    beforeEach(() => {
      service.updateIndex(tools);
    });

    it('returns top-K tools grouped by serverId', () => {
      const result = service.filterTools('list pods', 3);
      expect(result.scopedTools.size).toBeGreaterThan(0);

      let totalTools = 0;
      for (const names of result.scopedTools.values()) {
        totalTools += names.length;
      }
      expect(totalTools).toBeLessThanOrEqual(3);
    });

    it('returns scores sorted descending', () => {
      const result = service.filterTools('kubernetes pods', 3);
      for (let i = 1; i < result.scores.length; i++) {
        expect(result.scores[i - 1].score).toBeGreaterThanOrEqual(
          result.scores[i].score,
        );
      }
    });

    it('reports duration in milliseconds', () => {
      const result = service.filterTools('create issue', 3);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('intersects with admin allowedTools (never expands)', () => {
      const adminAllowed = new Map([['ocp', ['list_pods', 'get_logs']]]);

      const result = service.filterTools(
        'pods logs deployment',
        6,
        adminAllowed,
      );

      const ocpTools = result.scopedTools.get('ocp') ?? [];
      expect(ocpTools).not.toContain('scale_deployment');
      for (const name of ocpTools) {
        expect(['list_pods', 'get_logs']).toContain(name);
      }
    });

    it('returns all servers when no admin restriction', () => {
      const result = service.filterTools('list pods instances', 6);
      const servers = Array.from(result.scopedTools.keys());
      expect(servers.length).toBeGreaterThanOrEqual(1);
    });

    it('does not restrict servers absent from adminAllowedTools', () => {
      const adminAllowed = new Map([['ocp', ['list_pods']]]);
      const result = service.filterTools(
        'create github issue',
        6,
        adminAllowed,
      );
      const githubTools = result.scopedTools.get('github') ?? [];
      expect(githubTools.length).toBeGreaterThan(0);
    });

    it('filters out all tools when admin allows empty array for server', () => {
      const adminAllowed = new Map([['ocp', [] as string[]]]);
      const result = service.filterTools('list pods', 6, adminAllowed);
      const ocpTools = result.scopedTools.get('ocp') ?? [];
      expect(ocpTools).toEqual([]);
    });

    it('handles empty query gracefully', () => {
      const result = service.filterTools('', 3);
      expect(result.scopedTools).toBeDefined();
      expect(result.scores).toBeDefined();
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('minScore filtering', () => {
    const tools = [
      tool('ocp', 'list_pods', 'List all kubernetes pods in the cluster'),
      tool('ocp', 'get_logs', 'Get container logs from a running pod'),
      tool('github', 'create_issue', 'Create a new issue on GitHub'),
      tool('aws', 'list_instances', 'List EC2 instances in AWS'),
    ];

    beforeEach(() => {
      service.updateIndex(tools);
    });

    it('filters out low-scoring tools when minScore is set', () => {
      const withoutMin = service.filterTools('list pods', 10);
      const withMin = service.filterTools('list pods', 10, undefined, 0.1);

      let countWithout = 0;
      for (const names of withoutMin.scopedTools.values()) {
        countWithout += names.length;
      }
      let countWith = 0;
      for (const names of withMin.scopedTools.values()) {
        countWith += names.length;
      }

      expect(countWith).toBeLessThanOrEqual(countWithout);
    });

    it('returns no tools when minScore is impossibly high', () => {
      const result = service.filterTools('list pods', 10, undefined, 0.99);

      let total = 0;
      for (const names of result.scopedTools.values()) {
        total += names.length;
      }
      expect(total).toBe(0);
    });

    it('returns all top-K when minScore is 0', () => {
      const result = service.filterTools('list pods', 3, undefined, 0);
      expect(result.scores.length).toBe(3);
    });
  });

  describe('vocabulary consistency after incremental updates', () => {
    it('existing tools remain searchable after adding a new tool', () => {
      const initial = [
        tool('ocp', 'list_pods', 'List all kubernetes pods'),
        tool('ocp', 'get_logs', 'Get container logs'),
      ];
      service.updateIndex(initial);

      const beforeAdd = service.filterTools('list pods', 2);
      const beforePods = beforeAdd.scores.find(s => s.name === 'list_pods');
      expect(beforePods).toBeDefined();
      expect(beforePods!.score).toBeGreaterThan(0);

      service.updateIndex([
        ...initial,
        tool('github', 'create_issue', 'Create a new issue on GitHub'),
      ]);

      const afterAdd = service.filterTools('list pods', 3);
      const afterPods = afterAdd.scores.find(s => s.name === 'list_pods');
      expect(afterPods).toBeDefined();
      expect(afterPods!.score).toBeGreaterThan(0);
    });

    it('existing tools remain searchable after modifying a tool description', () => {
      const initial = [
        tool('ocp', 'list_pods', 'List all kubernetes pods'),
        tool('ocp', 'get_logs', 'Get container logs'),
        tool('github', 'create_issue', 'Create a GitHub issue'),
      ];
      service.updateIndex(initial);

      service.updateIndex([
        tool('ocp', 'list_pods', 'List all kubernetes pods'),
        tool('ocp', 'get_logs', 'Retrieve logs from containers and pods'),
        tool('github', 'create_issue', 'Create a GitHub issue'),
      ]);

      const result = service.filterTools('list pods', 3);
      const podsTool = result.scores.find(s => s.name === 'list_pods');
      expect(podsTool).toBeDefined();
      expect(podsTool!.score).toBeGreaterThan(0);
    });
  });

  describe('createToolScopeService factory', () => {
    it('creates a working service', () => {
      const svc = createToolScopeService(
        mockLogger as unknown as LoggerService,
      );
      svc.updateIndex([tool('s1', 'tool1', 'A helpful tool')]);
      const result = svc.filterTools('helpful', 1);
      expect(result.scopedTools.size).toBe(1);
    });
  });
});
