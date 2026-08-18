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

import type {
  Job,
  Module,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import {
  reconcileModuleJobs,
  listModulesWithReconciledStatuses,
} from './modulesReconcile';
import type { ReconcileJobDeps } from './services';

function mockDeps(): ReconcileJobDeps {
  return {
    kubeService: {
      getJobStatus: jest.fn().mockResolvedValue({ status: 'success' }),
      getJobLogs: jest.fn().mockResolvedValue('logs'),
      createJob: jest.fn(),
      deleteJob: jest.fn(),
    },
    x2aDatabase: {
      updateJob: jest.fn().mockResolvedValue({
        id: 'job-1',
        projectId: 'proj-1',
        moduleId: 'mod-1',
        phase: 'analyze',
        status: 'success',
        startedAt: new Date(),
        k8sJobName: 'k8s-1',
        callbackToken: 'must-not-leak-to-clients',
      }),
    } as any,
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      child: jest.fn(),
    } as any,
  };
}

function analyzeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 'job-1',
    projectId: 'proj-1',
    moduleId: 'mod-1',
    phase: 'analyze',
    status: 'running',
    startedAt: new Date(),
    k8sJobName: 'k8s-1',
    ...overrides,
  } as Job;
}

describe('reconcileModuleJobs', () => {
  it('strips callbackToken from phase job after DB reconciliation returns it', async () => {
    const module: Module = {
      id: 'mod-1',
      name: 'App',
      sourcePath: '/app',
      projectId: 'proj-1',
      analyze: analyzeJob(),
    };
    const deps = mockDeps();

    await reconcileModuleJobs(module, deps);

    expect(module.analyze).toBeDefined();
    expect(module.analyze).not.toHaveProperty('callbackToken');
    expect(module.analyze?.status).toBe('success');
  });
});

describe('listModulesWithReconciledStatuses', () => {
  it('never exposes callbackToken on reconciled phase jobs', async () => {
    const modules: Module[] = [
      {
        id: 'mod-1',
        name: 'App',
        sourcePath: '/app',
        projectId: 'proj-1',
        analyze: analyzeJob(),
      },
    ];
    const deps = mockDeps();

    await listModulesWithReconciledStatuses(modules, deps);

    expect(modules[0].analyze).toBeDefined();
    expect(modules[0].analyze).not.toHaveProperty('callbackToken');
  });
});
