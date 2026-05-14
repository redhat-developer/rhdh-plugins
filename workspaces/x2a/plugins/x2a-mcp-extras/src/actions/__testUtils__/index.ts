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

/**
 * Shared test infrastructure for x2a-mcp-extras action tests.
 *
 * Simulates the MCP call path:
 *   LLM  →  Backstage MCP server  →  ActionsRegistryService.register()
 *                                     → action({ input, credentials, logger })
 *
 * We capture each registered action via a mock ActionsRegistryService, then
 * invoke them directly with mock input/credentials exactly as the MCP runtime
 * would.
 */
import { mockServices } from '@backstage/backend-test-utils';
import { AuthorizeResult } from '@backstage/plugin-permission-common';

import { createX2aActions } from '../index';
import type { X2aActionsOptions } from '../index';

export type RegisteredAction = {
  name: string;
  action: (ctx: { input: any; credentials: any; logger: any }) => Promise<any>;
};

export type MocksResult = ReturnType<typeof buildMocks>;

export function buildMocks(overrides?: Partial<X2aActionsOptions>) {
  const registered: RegisteredAction[] = [];

  const actionsRegistry = {
    register: jest.fn((opts: any) => {
      registered.push({ name: opts.name, action: opts.action });
    }),
  };

  const auth = {
    isPrincipal: jest
      .fn()
      .mockImplementation((_creds: any, kind: string) => kind === 'user'),
    getOwnServiceCredentials: jest.fn(),
    authenticate: jest.fn(),
    getNoneCredentials: jest.fn(),
    getLimitedUserToken: jest.fn(),
    listPublicServiceKeys: jest.fn(),
  };

  const catalog = {
    getEntities: jest.fn().mockResolvedValue({ items: [] }),
    getEntityByRef: jest.fn().mockResolvedValue(undefined),
    removeEntityByUid: jest.fn(),
    refreshEntity: jest.fn(),
    getLocationByRef: jest.fn(),
    addLocation: jest.fn(),
    removeLocationById: jest.fn(),
    getLocationById: jest.fn(),
    getLocationByEntity: jest.fn(),
    queryEntities: jest.fn(),
    validateEntity: jest.fn(),
  };

  const config = mockServices.rootConfig({
    data: {
      app: { baseUrl: 'http://localhost:3000' },
      x2a: {
        git: {
          sourceRepo: { token: 'src-token-from-config' },
          targetRepo: { token: 'tgt-token-from-config' },
        },
      },
    },
  });

  const logger = mockServices.logger.mock();

  const permissionsSvc = {
    authorize: jest.fn().mockResolvedValue([{ result: AuthorizeResult.ALLOW }]),
    authorizeConditional: jest.fn(),
  };

  const kubeService = {
    createJob: jest.fn(),
    getJobStatus: jest.fn().mockResolvedValue({ status: 'running' }),
    getJobLogs: jest.fn().mockResolvedValue(''),
    deleteJob: jest.fn(),
  };

  const x2aDatabase = {
    createProject: jest.fn(),
    listProjects: jest.fn(),
    getProject: jest.fn(),
    listModules: jest.fn().mockResolvedValue([]),
    deleteProject: jest.fn(),
    createJob: jest.fn(),
    updateJob: jest.fn(),
    getJob: jest.fn(),
    deleteJob: jest.fn(),
    listJobsForProject: jest.fn(),
    listJobsForModule: jest.fn(),
    getJobLogs: jest.fn(),
    createJobLog: jest.fn(),
    createArtifacts: jest.fn(),
    getArtifacts: jest.fn(),
    getMigrationPlan: jest.fn(),
    updateMigrationPlan: jest.fn(),
  };

  const options: X2aActionsOptions = {
    actionsRegistry: actionsRegistry as any,
    auth: auth as any,
    catalog: catalog as any,
    config,
    logger,
    permissionsSvc: permissionsSvc as any,
    x2aDatabase: x2aDatabase as any,
    kubeService: kubeService as any,
    ...overrides,
  };

  // Simulate what the MCP server does
  createX2aActions(options);

  const getAction = (name: string) => {
    const entry = registered.find(r => r.name === name);
    if (!entry) {
      throw new Error(
        `Action "${name}" not registered. Registered: ${registered.map(r => r.name).join(', ')}`,
      );
    }
    return entry.action;
  };

  return {
    registered,
    getAction,
    actionsRegistry,
    auth,
    catalog,
    config,
    logger,
    permissionsSvc,
    x2aDatabase,
    kubeService,
  };
}

export const NOW = new Date('2025-06-01T12:00:00Z');

export const MOCK_PROJECT = {
  id: 'proj-001',
  name: 'Legacy EAP Migration',
  abbreviation: 'LEM',
  description: 'Migrate EAP 7 to EAP 8',
  sourceRepoUrl: 'https://github.com/acme/legacy-eap',
  targetRepoUrl: 'https://github.com/acme/new-eap',
  sourceRepoBranch: 'main',
  targetRepoBranch: 'main',
  ownedBy: 'user:default/mock',
  createdAt: NOW,
  status: { state: 'new' },
};
