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

const mockProjectsProjectIdModulesGet = jest.fn();
const mockProjectsProjectIdModulesModuleIdRunPost = jest.fn();
const mockProjectsGet = jest.fn();
const mockAuthenticate = jest.fn();

jest.mock('../ClientService', () => ({
  useClientService: () => ({
    projectsProjectIdModulesGet: mockProjectsProjectIdModulesGet,
    projectsProjectIdModulesModuleIdRunPost:
      mockProjectsProjectIdModulesModuleIdRunPost,
    projectsGet: mockProjectsGet,
  }),
}));

jest.mock('../repoAuth', () => ({
  useRepoAuthentication: () => ({ authenticate: mockAuthenticate }),
}));

jest.mock('../components/tools', () => ({
  canRunNextPhase: jest.fn(),
  getNextPhase: jest.fn(),
}));

jest.mock('./useScmHostMap', () => ({
  useScmHostMap: () => new Map(),
}));

jest.mock('@red-hat-developer-hub/backstage-plugin-x2a-common', () => ({
  ...jest.requireActual('@red-hat-developer-hub/backstage-plugin-x2a-common'),
  resolveScmProvider: jest.fn((_url: string) => ({
    getAuthTokenDescriptor: (readOnly: boolean) => ({
      repoUrl: _url,
      readOnly,
    }),
  })),
}));

import { renderHook } from '@testing-library/react';
import {
  MAX_CONCURRENT_BULK_RUN,
  Module,
  Project,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { canRunNextPhase, getNextPhase } from '../components/tools';
import { useBulkRun } from './useBulkRun';

const mockCanRunNextPhase = canRunNextPhase as jest.Mock;
const mockGetNextPhase = getNextPhase as jest.Mock;

const makeProject = (overrides?: Partial<Project>): Project => ({
  id: 'proj-1',
  name: 'Test Project',
  abbreviation: 'TP',
  sourceRepoUrl: 'https://github.com/org/source',
  targetRepoUrl: 'https://github.com/org/target',
  sourceRepoBranch: 'main',
  targetRepoBranch: 'main',
  createdAt: new Date('2024-01-01'),
  createdBy: 'user:default/alice',
  ...overrides,
});

const makeModule = (overrides?: Partial<Module>): Module => ({
  id: 'mod-1',
  name: 'module-1',
  sourcePath: '/src',
  projectId: 'proj-1',
  ...overrides,
});

const jsonResponse = (data: unknown) => ({
  ok: true,
  json: async () => data,
});

const setupAuth = () => {
  mockAuthenticate.mockResolvedValue([{ token: 'mock-token' }]);
};

describe('useBulkRun', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupAuth();
    mockCanRunNextPhase.mockReturnValue(true);
    mockGetNextPhase.mockReturnValue('analyze');
  });

  describe('runAllForProject', () => {
    it('fetches modules when none are provided', async () => {
      const project = makeProject();
      const modules = [makeModule()];

      mockProjectsProjectIdModulesGet.mockResolvedValue(jsonResponse(modules));
      mockProjectsProjectIdModulesModuleIdRunPost.mockResolvedValue(
        jsonResponse({ jobId: 'job-1' }),
      );

      const { result } = renderHook(() => useBulkRun());

      const outcome = await result.current.runAllForProject(project);

      expect(mockProjectsProjectIdModulesGet).toHaveBeenCalledWith({
        path: { projectId: 'proj-1' },
      });
      expect(outcome).toEqual({ total: 1, succeeded: 1, failed: 0 });
    });

    it('uses pre-provided modules instead of fetching', async () => {
      const project = makeProject();
      const modules = [makeModule()];

      mockProjectsProjectIdModulesModuleIdRunPost.mockResolvedValue(
        jsonResponse({ jobId: 'job-1' }),
      );

      const { result } = renderHook(() => useBulkRun());

      await result.current.runAllForProject(project, modules);

      expect(mockProjectsProjectIdModulesGet).not.toHaveBeenCalled();
    });

    it('returns zeros when no modules are eligible', async () => {
      const project = makeProject();
      const modules = [makeModule()];

      mockCanRunNextPhase.mockReturnValue(false);

      const { result } = renderHook(() => useBulkRun());

      const outcome = await result.current.runAllForProject(project, modules);

      expect(outcome).toEqual({ total: 0, succeeded: 0, failed: 0 });
      expect(mockAuthenticate).not.toHaveBeenCalled();
      expect(
        mockProjectsProjectIdModulesModuleIdRunPost,
      ).not.toHaveBeenCalled();
    });

    it('authenticates source (read-only) and target (read-write) repos', async () => {
      const project = makeProject({
        sourceRepoUrl: 'https://github.com/org/src',
        targetRepoUrl: 'https://github.com/org/tgt',
      });

      mockProjectsProjectIdModulesModuleIdRunPost.mockResolvedValue(
        jsonResponse({ jobId: 'job-1' }),
      );

      const { result } = renderHook(() => useBulkRun());

      await result.current.runAllForProject(project, [makeModule()]);

      expect(mockAuthenticate).toHaveBeenCalledTimes(2);
      expect(mockAuthenticate).toHaveBeenCalledWith([
        { repoUrl: 'https://github.com/org/src', readOnly: true },
      ]);
      expect(mockAuthenticate).toHaveBeenCalledWith([
        { repoUrl: 'https://github.com/org/tgt', readOnly: false },
      ]);
    });

    it('authenticates cross-provider repos (Bitbucket source, GitHub target)', async () => {
      const project = makeProject({
        sourceRepoUrl: 'https://bitbucket.org/ws/src',
        targetRepoUrl: 'https://github.com/org/tgt',
      });

      mockAuthenticate
        .mockResolvedValueOnce([{ token: 'gh-target-tok' }])
        .mockResolvedValueOnce([{ token: 'bb-source-tok' }]);
      mockProjectsProjectIdModulesModuleIdRunPost.mockResolvedValue(
        jsonResponse({ jobId: 'job-1' }),
      );

      const { result } = renderHook(() => useBulkRun());

      await result.current.runAllForProject(project, [makeModule()]);

      expect(mockAuthenticate).toHaveBeenCalledTimes(2);
      expect(mockAuthenticate).toHaveBeenCalledWith([
        { repoUrl: 'https://bitbucket.org/ws/src', readOnly: true },
      ]);
      expect(mockAuthenticate).toHaveBeenCalledWith([
        { repoUrl: 'https://github.com/org/tgt', readOnly: false },
      ]);

      expect(mockProjectsProjectIdModulesModuleIdRunPost).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            sourceRepoAuth: { token: 'bb-source-tok' },
            targetRepoAuth: { token: 'gh-target-tok' },
          }),
        }),
      );
    });

    it('sends correct phase and auth tokens in the run request', async () => {
      const project = makeProject();
      const mod = makeModule({ id: 'mod-x', projectId: 'proj-1' });
      mockGetNextPhase.mockReturnValue('migrate');

      mockAuthenticate
        .mockResolvedValueOnce([{ token: 'target-tok' }])
        .mockResolvedValueOnce([{ token: 'source-tok' }]);
      mockProjectsProjectIdModulesModuleIdRunPost.mockResolvedValue(
        jsonResponse({ jobId: 'job-1' }),
      );

      const { result } = renderHook(() => useBulkRun());

      await result.current.runAllForProject(project, [mod]);

      expect(mockProjectsProjectIdModulesModuleIdRunPost).toHaveBeenCalledWith({
        path: { projectId: 'proj-1', moduleId: 'mod-x' },
        body: {
          phase: 'migrate',
          sourceRepoAuth: { token: 'source-tok' },
          targetRepoAuth: { token: 'target-tok' },
        },
      });
    });

    it('runs multiple eligible modules in parallel', async () => {
      const project = makeProject();
      const modules = [
        makeModule({ id: 'mod-1' }),
        makeModule({ id: 'mod-2' }),
        makeModule({ id: 'mod-3' }),
      ];

      mockProjectsProjectIdModulesModuleIdRunPost.mockResolvedValue(
        jsonResponse({ jobId: 'job-1' }),
      );

      const { result } = renderHook(() => useBulkRun());

      const outcome = await result.current.runAllForProject(project, modules);

      expect(mockProjectsProjectIdModulesModuleIdRunPost).toHaveBeenCalledTimes(
        3,
      );
      expect(outcome).toEqual({ total: 3, succeeded: 3, failed: 0 });
    });

    it('counts partial failures correctly', async () => {
      const project = makeProject();
      const modules = [
        makeModule({ id: 'mod-ok', name: 'ok' }),
        makeModule({ id: 'mod-fail', name: 'fail' }),
      ];

      mockProjectsProjectIdModulesModuleIdRunPost.mockImplementation(
        async ({ path }: any) => {
          if (path.moduleId === 'mod-fail') {
            throw new Error('network error');
          }
          return jsonResponse({ jobId: 'job-1' });
        },
      );

      const { result } = renderHook(() => useBulkRun());

      const outcome = await result.current.runAllForProject(project, modules);

      expect(outcome).toEqual({ total: 2, succeeded: 1, failed: 1 });
    });

    it('treats missing jobId as a failure', async () => {
      const project = makeProject();

      mockProjectsProjectIdModulesModuleIdRunPost.mockResolvedValue(
        jsonResponse({}),
      );

      const { result } = renderHook(() => useBulkRun());

      const outcome = await result.current.runAllForProject(project, [
        makeModule(),
      ]);

      expect(outcome).toEqual({ total: 1, succeeded: 0, failed: 1 });
    });

    it('only runs eligible modules, skips ineligible', async () => {
      const project = makeProject();
      const eligible = makeModule({ id: 'mod-ok' });
      const ineligible = makeModule({ id: 'mod-skip' });

      mockCanRunNextPhase.mockImplementation((m: Module) => m.id === 'mod-ok');
      mockProjectsProjectIdModulesModuleIdRunPost.mockResolvedValue(
        jsonResponse({ jobId: 'job-1' }),
      );

      const { result } = renderHook(() => useBulkRun());

      const outcome = await result.current.runAllForProject(project, [
        eligible,
        ineligible,
      ]);

      expect(mockProjectsProjectIdModulesModuleIdRunPost).toHaveBeenCalledTimes(
        1,
      );
      expect(outcome).toEqual({ total: 1, succeeded: 1, failed: 0 });
    });

    it(`batches modules with at most ${MAX_CONCURRENT_BULK_RUN} concurrent requests`, async () => {
      const project = makeProject();
      const moduleCount = MAX_CONCURRENT_BULK_RUN + 3;
      const modules = Array.from({ length: moduleCount }, (_, i) =>
        makeModule({ id: `mod-${i}`, name: `module-${i}` }),
      );

      let activeConcurrent = 0;
      let maxConcurrent = 0;

      mockProjectsProjectIdModulesModuleIdRunPost.mockImplementation(
        async () => {
          activeConcurrent++;
          maxConcurrent = Math.max(maxConcurrent, activeConcurrent);
          await new Promise(r => setTimeout(r, 10));
          activeConcurrent--;
          return jsonResponse({ jobId: 'job-1' });
        },
      );

      const { result } = renderHook(() => useBulkRun());

      const outcome = await result.current.runAllForProject(project, modules);

      expect(maxConcurrent).toBeLessThanOrEqual(MAX_CONCURRENT_BULK_RUN);
      expect(mockProjectsProjectIdModulesModuleIdRunPost).toHaveBeenCalledTimes(
        moduleCount,
      );
      expect(outcome).toEqual({
        total: moduleCount,
        succeeded: moduleCount,
        failed: 0,
      });
    });

    it('processes all batches even when an earlier batch has failures', async () => {
      const project = makeProject();
      const modules = Array.from(
        { length: MAX_CONCURRENT_BULK_RUN + 2 },
        (_, i) => makeModule({ id: `mod-${i}`, name: `module-${i}` }),
      );

      mockProjectsProjectIdModulesModuleIdRunPost.mockImplementation(
        async ({ path }: any) => {
          if (path.moduleId === 'mod-0') {
            throw new Error('first-batch failure');
          }
          return jsonResponse({ jobId: 'job-1' });
        },
      );

      const { result } = renderHook(() => useBulkRun());

      const outcome = await result.current.runAllForProject(project, modules);

      expect(mockProjectsProjectIdModulesModuleIdRunPost).toHaveBeenCalledTimes(
        modules.length,
      );
      expect(outcome).toEqual({
        total: modules.length,
        succeeded: modules.length - 1,
        failed: 1,
      });
    });

    it('aggregates counts across batches correctly', async () => {
      const project = makeProject();
      const modules = Array.from(
        { length: MAX_CONCURRENT_BULK_RUN * 2 + 1 },
        (_, i) => makeModule({ id: `mod-${i}`, name: `module-${i}` }),
      );

      mockProjectsProjectIdModulesModuleIdRunPost.mockResolvedValue(
        jsonResponse({ jobId: 'job-1' }),
      );

      const { result } = renderHook(() => useBulkRun());

      const outcome = await result.current.runAllForProject(project, modules);

      expect(outcome).toEqual({
        total: modules.length,
        succeeded: modules.length,
        failed: 0,
      });
    });
  });

  describe('runAllGlobal', () => {
    const setupGlobalProjects = (projects: Project[]) => {
      mockProjectsGet.mockResolvedValue(
        jsonResponse({ items: projects, totalCount: projects.length }),
      );
    };

    const setupPaginatedProjects = (pages: Project[][], totalCount: number) => {
      mockProjectsGet.mockImplementation(async ({ query }: any) =>
        jsonResponse({
          items: pages[query.page] ?? [],
          totalCount,
        }),
      );
    };

    const setupModulesForProjects = (
      modulesByProjectId: Record<string, Module[]>,
    ) => {
      mockProjectsProjectIdModulesGet.mockImplementation(
        async ({ path }: any) =>
          jsonResponse(modulesByProjectId[path.projectId] ?? []),
      );
    };

    it('fetches the first page of projects', async () => {
      setupGlobalProjects([]);

      const { result } = renderHook(() => useBulkRun());

      await result.current.runAllGlobal();

      expect(mockProjectsGet).toHaveBeenCalledWith({
        query: { pageSize: 100, page: 0 },
      });
    });

    it('returns zeros when there are no projects', async () => {
      setupGlobalProjects([]);

      const { result } = renderHook(() => useBulkRun());

      const outcome = await result.current.runAllGlobal();

      expect(outcome).toEqual({ total: 0, succeeded: 0, failed: 0 });
    });

    it('paginates through all pages when totalCount exceeds a single page', async () => {
      const p1 = makeProject({ id: 'p1' });
      const p2 = makeProject({ id: 'p2' });
      const p3 = makeProject({ id: 'p3' });
      setupPaginatedProjects([[p1, p2], [p3]], 3);
      setupModulesForProjects({
        p1: [makeModule({ id: 'm1', projectId: 'p1' })],
        p2: [makeModule({ id: 'm2', projectId: 'p2' })],
        p3: [makeModule({ id: 'm3', projectId: 'p3' })],
      });
      mockProjectsProjectIdModulesModuleIdRunPost.mockResolvedValue(
        jsonResponse({ jobId: 'job-1' }),
      );

      const { result } = renderHook(() => useBulkRun());

      const outcome = await result.current.runAllGlobal();

      expect(mockProjectsGet).toHaveBeenCalledTimes(2);
      expect(mockProjectsGet).toHaveBeenCalledWith({
        query: { pageSize: 100, page: 0 },
      });
      expect(mockProjectsGet).toHaveBeenCalledWith({
        query: { pageSize: 100, page: 1 },
      });
      expect(outcome).toEqual({ total: 3, succeeded: 3, failed: 0 });
    });

    it('stops paginating once all items are fetched', async () => {
      const projects = Array.from({ length: 3 }, (_, i) =>
        makeProject({ id: `p${i}` }),
      );
      setupPaginatedProjects([projects], 3);

      const { result } = renderHook(() => useBulkRun());

      await result.current.runAllGlobal();

      expect(mockProjectsGet).toHaveBeenCalledTimes(1);
    });

    it('paginates using page size when totalCount is absent', async () => {
      const p1 = makeProject({ id: 'p1' });
      const p2 = makeProject({ id: 'p2' });

      mockProjectsGet.mockImplementation(async ({ query }: any) => {
        if (query.page === 0) {
          return jsonResponse({ items: [p1, p2] });
        }
        return jsonResponse({ items: [] });
      });
      setupModulesForProjects({
        p1: [makeModule({ id: 'm1', projectId: 'p1' })],
        p2: [makeModule({ id: 'm2', projectId: 'p2' })],
      });
      mockProjectsProjectIdModulesModuleIdRunPost.mockResolvedValue(
        jsonResponse({ jobId: 'job-1' }),
      );

      const { result } = renderHook(() => useBulkRun());

      const outcome = await result.current.runAllGlobal();

      expect(outcome).toEqual({ total: 2, succeeded: 2, failed: 0 });
    });

    it('stops on empty page even when totalCount is absent', async () => {
      mockProjectsGet.mockResolvedValue(jsonResponse({ items: [] }));

      const { result } = renderHook(() => useBulkRun());

      const outcome = await result.current.runAllGlobal();

      expect(mockProjectsGet).toHaveBeenCalledTimes(1);
      expect(outcome).toEqual({ total: 0, succeeded: 0, failed: 0 });
    });

    it('aggregates results from multiple projects', async () => {
      const p1 = makeProject({ id: 'p1' });
      const p2 = makeProject({ id: 'p2' });
      setupGlobalProjects([p1, p2]);
      setupModulesForProjects({
        p1: [makeModule({ id: 'm1', projectId: 'p1' })],
        p2: [
          makeModule({ id: 'm2', projectId: 'p2' }),
          makeModule({ id: 'm3', projectId: 'p2' }),
        ],
      });
      mockProjectsProjectIdModulesModuleIdRunPost.mockResolvedValue(
        jsonResponse({ jobId: 'job-1' }),
      );

      const { result } = renderHook(() => useBulkRun());

      const outcome = await result.current.runAllGlobal();

      expect(outcome).toEqual({ total: 3, succeeded: 3, failed: 0 });
    });

    it('applies project filter when provided', async () => {
      const p1 = makeProject({ id: 'p1', name: 'keep' });
      const p2 = makeProject({ id: 'p2', name: 'skip' });
      setupGlobalProjects([p1, p2]);
      setupModulesForProjects({
        p1: [makeModule({ id: 'm1', projectId: 'p1' })],
        p2: [makeModule({ id: 'm2', projectId: 'p2' })],
      });
      mockProjectsProjectIdModulesModuleIdRunPost.mockResolvedValue(
        jsonResponse({ jobId: 'job-1' }),
      );

      const { result } = renderHook(() => useBulkRun());

      const outcome = await result.current.runAllGlobal(p => p.name === 'keep');

      expect(outcome).toEqual({ total: 1, succeeded: 1, failed: 0 });
      expect(mockProjectsProjectIdModulesGet).toHaveBeenCalledTimes(1);
      expect(mockProjectsProjectIdModulesGet).toHaveBeenCalledWith({
        path: { projectId: 'p1' },
      });
    });

    it('counts a project-level failure without aborting others', async () => {
      const p1 = makeProject({ id: 'p1' });
      const p2 = makeProject({ id: 'p2' });
      setupGlobalProjects([p1, p2]);

      mockProjectsProjectIdModulesGet.mockImplementation(
        async ({ path }: any) => {
          if (path.projectId === 'p1') {
            throw new Error('network error');
          }
          return jsonResponse([makeModule({ id: 'm2', projectId: 'p2' })]);
        },
      );
      mockProjectsProjectIdModulesModuleIdRunPost.mockResolvedValue(
        jsonResponse({ jobId: 'job-1' }),
      );

      const { result } = renderHook(() => useBulkRun());

      const outcome = await result.current.runAllGlobal();

      expect(outcome).toEqual({ total: 1, succeeded: 1, failed: 1 });
    });

    it(`processes projects in batches of at most ${MAX_CONCURRENT_BULK_RUN}`, async () => {
      const projects = Array.from({ length: 7 }, (_, i) =>
        makeProject({ id: `p${i}` }),
      );
      setupGlobalProjects(projects);

      const callOrder: string[] = [];
      let activeConcurrent = 0;
      let maxConcurrent = 0;

      mockProjectsProjectIdModulesGet.mockImplementation(
        async ({ path }: any) => {
          activeConcurrent++;
          maxConcurrent = Math.max(maxConcurrent, activeConcurrent);
          callOrder.push(path.projectId);
          await new Promise(r => setTimeout(r, 10));
          activeConcurrent--;
          return jsonResponse([]);
        },
      );

      const { result } = renderHook(() => useBulkRun());

      await result.current.runAllGlobal();

      expect(maxConcurrent).toBeLessThanOrEqual(MAX_CONCURRENT_BULK_RUN);
      expect(callOrder).toHaveLength(7);
    });
  });
});
