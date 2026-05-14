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
const mockProjectsProjectIdRunPost = jest.fn();
const mockProjectsGet = jest.fn();
const mockAuthenticate = jest.fn();

jest.mock('../ClientService', () => ({
  useClientService: () => ({
    projectsProjectIdModulesGet: mockProjectsProjectIdModulesGet,
    projectsProjectIdModulesModuleIdRunPost:
      mockProjectsProjectIdModulesModuleIdRunPost,
    projectsProjectIdRunPost: mockProjectsProjectIdRunPost,
    projectsGet: mockProjectsGet,
  }),
}));

jest.mock('../repoAuth', () => ({
  useRepoAuthentication: () => ({ authenticate: mockAuthenticate }),
}));

jest.mock('../components/tools', () => ({
  ...jest.requireActual('../components/tools'),
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

jest.mock('./useTranslation', () => ({
  useTranslation: require('../test-utils/mockTranslations').mockUseTranslation,
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
  ownedBy: 'user:default/alice',
  ...overrides,
});

const makeModule = (overrides?: Partial<Module>): Module => ({
  id: 'mod-1',
  name: 'module-1',
  sourcePath: '/src',
  projectId: 'proj-1',
  ...overrides,
});

const withModulesStatus: Pick<Project, 'status'> = {
  status: {
    state: 'inProgress',
    modulesSummary: {
      total: 1,
      finished: 0,
      waiting: 1,
      pending: 0,
      running: 0,
      error: 0,
      cancelled: 0,
    },
  },
};

const jsonResponse = (data: unknown) => ({
  ok: true,
  status: 200,
  json: async () => data,
});

const jsonErrorResponse = (data: unknown, status: number) => ({
  ok: false,
  status,
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

    it('throws with server message when module run response is not ok', async () => {
      const project = makeProject();
      const modules = [makeModule({ id: 'mod-1', name: 'module-1' })];

      mockProjectsProjectIdModulesModuleIdRunPost.mockResolvedValue(
        jsonErrorResponse(
          {
            error: { name: 'ConflictError', message: 'Job already running' },
          },
          409,
        ),
      );

      const { result } = renderHook(() => useBulkRun());

      const outcome = await result.current.runAllForProject(project, modules);

      expect(outcome).toEqual({ total: 1, succeeded: 0, failed: 1 });
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
      const p1 = makeProject({ id: 'p1', ...withModulesStatus });
      const p2 = makeProject({ id: 'p2', ...withModulesStatus });
      const p3 = makeProject({ id: 'p3', ...withModulesStatus });
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
        makeProject({ id: `p${i}`, ...withModulesStatus }),
      );
      setupPaginatedProjects([projects], 3);

      const { result } = renderHook(() => useBulkRun());

      await result.current.runAllGlobal();

      expect(mockProjectsGet).toHaveBeenCalledTimes(1);
    });

    it('paginates using page size when totalCount is absent', async () => {
      const p1 = makeProject({ id: 'p1', ...withModulesStatus });
      const p2 = makeProject({ id: 'p2', ...withModulesStatus });

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
      const p1 = makeProject({ id: 'p1', ...withModulesStatus });
      const p2 = makeProject({ id: 'p2', ...withModulesStatus });
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
      const p1 = makeProject({ id: 'p1', name: 'keep', ...withModulesStatus });
      const p2 = makeProject({ id: 'p2', name: 'skip', ...withModulesStatus });
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
      const p1 = makeProject({ id: 'p1', ...withModulesStatus });
      const p2 = makeProject({ id: 'p2', ...withModulesStatus });
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
        makeProject({ id: `p${i}`, ...withModulesStatus }),
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

    it('retriggers init for projects with no modules and no running init', async () => {
      const initEligible = makeProject({
        id: 'p-init',
        initJob: { id: 'j1', status: 'error' } as any,
      });
      setupGlobalProjects([initEligible]);

      mockProjectsProjectIdRunPost.mockResolvedValue(
        jsonResponse({ jobId: 'init-job-1', status: 'pending' }),
      );

      const { result } = renderHook(() => useBulkRun());

      const outcome = await result.current.runAllGlobal();

      expect(mockProjectsProjectIdRunPost).toHaveBeenCalledTimes(1);
      expect(mockProjectsProjectIdRunPost).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { projectId: 'p-init' },
        }),
      );
      expect(mockProjectsProjectIdModulesGet).not.toHaveBeenCalled();
      expect(outcome).toEqual({ total: 1, succeeded: 1, failed: 0 });
    });

    it('does not retrigger init when init job is running', async () => {
      const runningInit = makeProject({
        id: 'p-running',
        initJob: { id: 'j1', status: 'running' } as any,
      });
      setupGlobalProjects([runningInit]);

      mockProjectsProjectIdModulesGet.mockResolvedValue(jsonResponse([]));

      const { result } = renderHook(() => useBulkRun());

      const outcome = await result.current.runAllGlobal();

      expect(mockProjectsProjectIdRunPost).not.toHaveBeenCalled();
      expect(mockProjectsProjectIdModulesGet).toHaveBeenCalledTimes(1);
      expect(outcome).toEqual({ total: 0, succeeded: 0, failed: 0 });
    });

    it('does not retrigger init when init job is pending', async () => {
      const pendingInit = makeProject({
        id: 'p-pending',
        initJob: { id: 'j1', status: 'pending' } as any,
      });
      setupGlobalProjects([pendingInit]);

      mockProjectsProjectIdModulesGet.mockResolvedValue(jsonResponse([]));

      const { result } = renderHook(() => useBulkRun());

      const outcome = await result.current.runAllGlobal();

      expect(mockProjectsProjectIdRunPost).not.toHaveBeenCalled();
      expect(outcome).toEqual({ total: 0, succeeded: 0, failed: 0 });
    });

    it('runs modules instead of retrigger when project has modules', async () => {
      const withModules = makeProject({
        id: 'p-mods',
        status: {
          state: 'inProgress',
          modulesSummary: {
            total: 2,
            finished: 0,
            waiting: 1,
            pending: 1,
            running: 0,
            error: 0,
            cancelled: 0,
          },
        },
      });
      setupGlobalProjects([withModules]);
      setupModulesForProjects({
        'p-mods': [
          makeModule({ id: 'm1', projectId: 'p-mods' }),
          makeModule({ id: 'm2', projectId: 'p-mods' }),
        ],
      });
      mockProjectsProjectIdModulesModuleIdRunPost.mockResolvedValue(
        jsonResponse({ jobId: 'job-1' }),
      );

      const { result } = renderHook(() => useBulkRun());

      const outcome = await result.current.runAllGlobal();

      expect(mockProjectsProjectIdRunPost).not.toHaveBeenCalled();
      expect(mockProjectsProjectIdModulesModuleIdRunPost).toHaveBeenCalledTimes(
        2,
      );
      expect(outcome).toEqual({ total: 2, succeeded: 2, failed: 0 });
    });

    it('mixes module runs and init retriggers across projects', async () => {
      const initEligible = makeProject({
        id: 'p-init',
        initJob: { id: 'j1', status: 'error' } as any,
      });
      const withModules = makeProject({
        id: 'p-mods',
        status: {
          state: 'inProgress',
          modulesSummary: {
            total: 1,
            finished: 0,
            waiting: 1,
            pending: 0,
            running: 0,
            error: 0,
            cancelled: 0,
          },
        },
      });
      setupGlobalProjects([initEligible, withModules]);
      setupModulesForProjects({
        'p-mods': [makeModule({ id: 'm1', projectId: 'p-mods' })],
      });
      mockProjectsProjectIdRunPost.mockResolvedValue(
        jsonResponse({ jobId: 'init-job-1', status: 'pending' }),
      );
      mockProjectsProjectIdModulesModuleIdRunPost.mockResolvedValue(
        jsonResponse({ jobId: 'mod-job-1' }),
      );

      const { result } = renderHook(() => useBulkRun());

      const outcome = await result.current.runAllGlobal();

      expect(mockProjectsProjectIdRunPost).toHaveBeenCalledTimes(1);
      expect(mockProjectsProjectIdModulesModuleIdRunPost).toHaveBeenCalledTimes(
        1,
      );
      expect(outcome).toEqual({ total: 2, succeeded: 2, failed: 0 });
    });

    it('passes userPrompt to retriggerInit when provided', async () => {
      const initEligible = makeProject({
        id: 'p-init',
        initJob: { id: 'j1', status: 'error' } as any,
      });
      setupGlobalProjects([initEligible]);

      mockProjectsProjectIdRunPost.mockResolvedValue(
        jsonResponse({ jobId: 'init-job-1', status: 'pending' }),
      );

      const { result } = renderHook(() => useBulkRun());

      await result.current.runAllGlobal(undefined, 'global prompt');

      expect(mockProjectsProjectIdRunPost).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            userPrompt: 'global prompt',
          }),
        }),
      );
    });

    it('omits userPrompt in retriggerInit when not provided to runAllGlobal', async () => {
      const initEligible = makeProject({
        id: 'p-init',
        initJob: { id: 'j1', status: 'error' } as any,
      });
      setupGlobalProjects([initEligible]);

      mockProjectsProjectIdRunPost.mockResolvedValue(
        jsonResponse({ jobId: 'init-job-1', status: 'pending' }),
      );

      const { result } = renderHook(() => useBulkRun());

      await result.current.runAllGlobal();

      expect(mockProjectsProjectIdRunPost).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.not.objectContaining({
            userPrompt: expect.anything(),
          }),
        }),
      );
    });

    it('counts failed init retrigger in the failed total', async () => {
      const initEligible = makeProject({
        id: 'p-init',
        initJob: { id: 'j1', status: 'error' } as any,
      });
      setupGlobalProjects([initEligible]);

      mockProjectsProjectIdRunPost.mockRejectedValue(
        new Error('init retrigger failed'),
      );

      const { result } = renderHook(() => useBulkRun());

      const outcome = await result.current.runAllGlobal();

      expect(outcome).toEqual({ total: 1, succeeded: 0, failed: 1 });
    });
  });

  describe('retriggerInit', () => {
    it('calls projectsProjectIdRunPost with correct project ID and auth tokens', async () => {
      const project = makeProject();

      mockAuthenticate
        .mockResolvedValueOnce([{ token: 'target-tok' }])
        .mockResolvedValueOnce([{ token: 'source-tok' }]);
      mockProjectsProjectIdRunPost.mockResolvedValue(
        jsonResponse({ jobId: 'init-job-1', status: 'pending' }),
      );

      const { result } = renderHook(() => useBulkRun());

      const jobId = await result.current.retriggerInit(project);

      expect(jobId).toBe('init-job-1');
      expect(mockProjectsProjectIdRunPost).toHaveBeenCalledWith({
        path: { projectId: 'proj-1' },
        body: {
          sourceRepoAuth: { token: 'source-tok' },
          targetRepoAuth: { token: 'target-tok' },
        },
      });
    });

    it('authenticates source (read-only) and target (read-write) repos', async () => {
      const project = makeProject({
        sourceRepoUrl: 'https://github.com/org/src',
        targetRepoUrl: 'https://github.com/org/tgt',
      });

      mockProjectsProjectIdRunPost.mockResolvedValue(
        jsonResponse({ jobId: 'init-job-1', status: 'pending' }),
      );

      const { result } = renderHook(() => useBulkRun());

      await result.current.retriggerInit(project);

      expect(mockAuthenticate).toHaveBeenCalledTimes(2);
      expect(mockAuthenticate).toHaveBeenCalledWith([
        { repoUrl: 'https://github.com/org/tgt', readOnly: false },
      ]);
      expect(mockAuthenticate).toHaveBeenCalledWith([
        { repoUrl: 'https://github.com/org/src', readOnly: true },
      ]);
    });

    it('reuses target token when source and target URLs match', async () => {
      const sameUrl = 'https://github.com/org/repo';
      const project = makeProject({
        sourceRepoUrl: sameUrl,
        targetRepoUrl: sameUrl,
      });

      mockAuthenticate.mockResolvedValueOnce([{ token: 'shared-tok' }]);
      mockProjectsProjectIdRunPost.mockResolvedValue(
        jsonResponse({ jobId: 'init-job-1', status: 'pending' }),
      );

      const { result } = renderHook(() => useBulkRun());

      await result.current.retriggerInit(project);

      expect(mockAuthenticate).toHaveBeenCalledTimes(1);
      expect(mockProjectsProjectIdRunPost).toHaveBeenCalledWith({
        path: { projectId: 'proj-1' },
        body: {
          sourceRepoAuth: { token: 'shared-tok' },
          targetRepoAuth: { token: 'shared-tok' },
        },
      });
    });

    it('includes userPrompt in the request body when provided', async () => {
      const project = makeProject();

      mockAuthenticate
        .mockResolvedValueOnce([{ token: 'target-tok' }])
        .mockResolvedValueOnce([{ token: 'source-tok' }]);
      mockProjectsProjectIdRunPost.mockResolvedValue(
        jsonResponse({ jobId: 'init-job-2', status: 'pending' }),
      );

      const { result } = renderHook(() => useBulkRun());

      const jobId = await result.current.retriggerInit(
        project,
        'custom prompt',
      );

      expect(jobId).toBe('init-job-2');
      expect(mockProjectsProjectIdRunPost).toHaveBeenCalledWith({
        path: { projectId: 'proj-1' },
        body: {
          sourceRepoAuth: { token: 'source-tok' },
          targetRepoAuth: { token: 'target-tok' },
          userPrompt: 'custom prompt',
        },
      });
    });

    it('omits userPrompt from the request body when not provided', async () => {
      const project = makeProject();

      mockAuthenticate
        .mockResolvedValueOnce([{ token: 'target-tok' }])
        .mockResolvedValueOnce([{ token: 'source-tok' }]);
      mockProjectsProjectIdRunPost.mockResolvedValue(
        jsonResponse({ jobId: 'init-job-3', status: 'pending' }),
      );

      const { result } = renderHook(() => useBulkRun());

      await result.current.retriggerInit(project);

      expect(mockProjectsProjectIdRunPost).toHaveBeenCalledWith({
        path: { projectId: 'proj-1' },
        body: {
          sourceRepoAuth: { token: 'source-tok' },
          targetRepoAuth: { token: 'target-tok' },
        },
      });
    });

    it('throws when response has no jobId', async () => {
      const project = makeProject();

      mockProjectsProjectIdRunPost.mockResolvedValue(jsonResponse({}));

      const { result } = renderHook(() => useBulkRun());

      await expect(result.current.retriggerInit(project)).rejects.toThrow(
        'No jobId returned for project init',
      );
    });

    it('throws when API call fails', async () => {
      const project = makeProject();

      mockProjectsProjectIdRunPost.mockRejectedValue(
        new Error('network error'),
      );

      const { result } = renderHook(() => useBulkRun());

      await expect(result.current.retriggerInit(project)).rejects.toThrow(
        'network error',
      );
    });

    it('throws with server message when HTTP response is not ok (409)', async () => {
      const project = makeProject();

      mockProjectsProjectIdRunPost.mockResolvedValue(
        jsonErrorResponse(
          {
            error: 'JobAlreadyRunning',
            message: 'An init job is already running for this project',
            details: 'Please wait for the current job to complete',
          },
          409,
        ),
      );

      const { result } = renderHook(() => useBulkRun());

      await expect(result.current.retriggerInit(project)).rejects.toThrow(
        'An init job is already running for this project',
      );
    });

    it('throws with Backstage error message when HTTP response is not ok (404)', async () => {
      const project = makeProject();

      mockProjectsProjectIdRunPost.mockResolvedValue(
        jsonErrorResponse(
          {
            error: {
              name: 'NotFoundError',
              message: 'Project with id proj-1 not found',
            },
          },
          404,
        ),
      );

      const { result } = renderHook(() => useBulkRun());

      await expect(result.current.retriggerInit(project)).rejects.toThrow(
        'Project with id proj-1 not found',
      );
    });

    it('throws when authentication fails', async () => {
      const project = makeProject();

      mockAuthenticate.mockRejectedValue(
        new Error('GitHub auth provider is not configured'),
      );

      const { result } = renderHook(() => useBulkRun());

      await expect(result.current.retriggerInit(project)).rejects.toThrow(
        'GitHub auth provider is not configured',
      );
      expect(mockProjectsProjectIdRunPost).not.toHaveBeenCalled();
    });
  });
});
