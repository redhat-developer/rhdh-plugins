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
 * Integration test: wires the x2aMcpExtrasPlugin with a real SQLite-backed
 * x2aDatabaseServiceFactory, verifying the full chain from plugin init through
 * service ref resolution to real DB operations.
 */
import {
  mockCredentials,
  mockServices,
  startTestBackend,
} from '@backstage/backend-test-utils';
import { createServiceFactory } from '@backstage/backend-plugin-api';
import { actionsRegistryServiceRef } from '@backstage/backend-plugin-api/alpha';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
// eslint-disable-next-line @backstage/no-mixed-plugin-imports -- integration test: real SQLite via sibling backend factory
import { x2aDatabaseServiceFactory } from '@red-hat-developer-hub/backstage-plugin-x2a-backend';
import { kubeServiceRef } from '@red-hat-developer-hub/backstage-plugin-x2a-node';
import { RUN_NEXT_DEEP_LINK_HASH } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { x2aMcpExtrasPlugin } from './plugin';

type RegisteredAction = {
  name: string;
  action: (ctx: { input: any; credentials: any; logger: any }) => Promise<any>;
};

const MOCK_USER = 'user:default/integration';

const BASE_CONFIG = {
  app: { baseUrl: 'http://localhost:3000' },
  backend: {
    database: {
      client: 'better-sqlite3',
      connection: ':memory:',
    },
  },
  x2a: {
    kubernetes: {
      namespace: 'test-ns',
      image: 'test-image',
      imageTag: 'test',
      ttlSecondsAfterFinished: 86400,
      resources: {
        requests: { cpu: '100m', memory: '128Mi' },
        limits: { cpu: '200m', memory: '256Mi' },
      },
    },
    credentials: { llm: { LLM_MODEL: 'test-model' } },
  },
};

describe('x2aMcpExtrasPlugin integration (real SQLite)', () => {
  let actions: RegisteredAction[];

  beforeAll(async () => {
    actions = [];

    await startTestBackend({
      features: [
        x2aMcpExtrasPlugin,
        x2aDatabaseServiceFactory,
        mockServices.rootLogger.factory(),
        mockServices.rootConfig.factory({ data: BASE_CONFIG }),
        mockServices.auth.factory(),
        mockServices.httpAuth.factory({
          defaultCredentials: mockCredentials.user(MOCK_USER),
        }),
        mockServices.permissions.mock({
          authorize: async () => [{ result: AuthorizeResult.ALLOW }],
        }).factory,
        mockServices.userInfo.factory(),
        createServiceFactory({
          service: actionsRegistryServiceRef,
          deps: {},
          factory: () => ({
            register: (opts: any) => {
              actions.push({ name: opts.name, action: opts.action });
            },
          }),
        }),
        createServiceFactory({
          service: kubeServiceRef,
          deps: {},
          factory: () => ({
            createJob: jest.fn().mockResolvedValue({ k8sJobName: 'mock-k8s' }),
            getJobStatus: jest.fn().mockResolvedValue({ status: 'running' }),
            getJobLogs: jest.fn().mockResolvedValue(''),
            deleteJob: jest.fn(),
          }),
        }),
        createServiceFactory({
          service: catalogServiceRef,
          deps: {},
          factory: () =>
            ({
              getEntityByRef: jest.fn().mockResolvedValue(undefined),
              getEntities: jest.fn().mockResolvedValue({ items: [] }),
              getEntitiesByRefs: jest.fn().mockResolvedValue({ items: [] }),
              getEntityAncestors: jest.fn().mockResolvedValue({ items: [] }),
              getEntityFacets: jest.fn().mockResolvedValue({ facets: {} }),
              getLocations: jest.fn().mockResolvedValue([]),
              removeEntityByUid: jest.fn(),
              refreshEntity: jest.fn(),
              getLocationByRef: jest.fn(),
              addLocation: jest.fn(),
              removeLocationById: jest.fn(),
              getLocationById: jest.fn(),
              getLocationByEntity: jest.fn(),
              queryEntities: jest.fn(),
              validateEntity: jest.fn(),
            }) as any,
        }),
      ],
    });
  });

  const getAction = (name: string) => {
    const entry = actions.find(r => r.name === name);
    if (!entry) {
      throw new Error(
        `Action "${name}" not registered. Available: ${actions.map(r => r.name).join(', ')}`,
      );
    }
    return entry.action;
  };

  const credentials = mockCredentials.user(MOCK_USER);
  const logger = mockServices.logger.mock();

  it('registers all expected actions', () => {
    const names = actions.map(a => a.name).sort((a, b) => a.localeCompare(b));
    expect(names).toEqual([
      'x2a-create-project',
      'x2a-list-modules',
      'x2a-list-projects',
      'x2a-trigger-next-phase',
    ]);
  });

  it('create → list → trigger-next-phase flow against real DB', async () => {
    const createAction = getAction('x2a-create-project');
    const listAction = getAction('x2a-list-projects');
    const triggerAction = getAction('x2a-trigger-next-phase');

    // 1. Create a project
    const createResult = await createAction({
      input: {
        name: 'Integration Test Project',
        description: 'Verify end-to-end wiring',
        abbreviation: 'ITP',
        sourceRepoUrl: 'https://github.com/acme/source',
        targetRepoUrl: 'https://github.com/acme/target',
        sourceRepoBranch: 'main',
        targetRepoBranch: 'main',
      },
      credentials,
      logger,
    });

    expect(createResult.output).toMatchObject({
      id: expect.any(String),
      name: 'Integration Test Project',
      abbreviation: 'ITP',
      ownedBy: MOCK_USER,
      projectDetailsUrl: expect.stringContaining('/x2a/projects/'),
    });
    const projectId = createResult.output.id;

    // 2. List projects — the created project should appear
    const listResult = await listAction({
      input: {},
      credentials,
      logger,
    });

    expect(listResult.output.totalCount).toBe(1);
    expect(listResult.output.projectListUrl).toBe(
      'http://localhost:3000/x2a/projects',
    );
    expect(listResult.output.items[0]).toMatchObject({
      id: projectId,
      name: 'Integration Test Project',
    });

    // 3. Trigger-next-phase returns the project details URL
    const triggerResult = await triggerAction({
      input: { projectId },
      credentials,
      logger,
    });

    expect(triggerResult.output).toMatchObject({
      projectId,
      name: 'Integration Test Project',
      projectDetailsUrl: `http://localhost:3000/x2a/projects/${projectId}${RUN_NEXT_DEEP_LINK_HASH}`,
    });

    const listModulesAction = getAction('x2a-list-modules');
    const listModulesResult = await listModulesAction({
      input: { projectId },
      credentials,
      logger,
    });
    expect(listModulesResult.output).toMatchObject({
      projectId,
      projectName: 'Integration Test Project',
      projectDetailsUrl: `http://localhost:3000/x2a/projects/${projectId}`,
      items: [],
    });
  });
});
