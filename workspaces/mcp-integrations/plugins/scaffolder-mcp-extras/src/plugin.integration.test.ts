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
  mockCredentials,
  mockServices,
  startTestBackend,
} from '@backstage/backend-test-utils';
import { createServiceFactory } from '@backstage/backend-plugin-api';
import { actionsRegistryServiceRef } from '@backstage/backend-plugin-api/alpha';
import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';
import { mcpScaffolderExtrasPlugin } from './plugin';

const EXPECTED_ACTIONS = [
  'execute-template',
  'fetch-template-metadata',
  'get-scaffolder-task-logs',
  'list-scaffolder-actions',
  'list-scaffolder-tasks',
  'validate-scaffolder',
];

describe('mcpScaffolderExtrasPlugin integration', () => {
  let registeredActionNames: string[];

  beforeAll(async () => {
    registeredActionNames = [];

    await startTestBackend({
      features: [
        mcpScaffolderExtrasPlugin,
        mockServices.rootLogger.factory(),
        mockServices.rootConfig.factory({
          data: {
            backend: { baseUrl: 'http://localhost:7007' },
          },
        }),
        mockServices.auth.factory(),
        mockServices.httpAuth.factory({
          defaultCredentials: mockCredentials.user('user:default/test'),
        }),
        catalogServiceMock.factory({ entities: [] }),
        createServiceFactory({
          service: actionsRegistryServiceRef,
          deps: {},
          factory: () => ({
            register: (opts: { name: string }) => {
              registeredActionNames.push(opts.name);
            },
          }),
        }),
      ],
    });
  });

  it('registers all expected MCP actions', () => {
    const sortedRegistered = [...registeredActionNames].sort((a, b) =>
      a.localeCompare(b),
    );
    const sortedExpected = [...EXPECTED_ACTIONS].sort((a, b) =>
      a.localeCompare(b),
    );

    expect(sortedRegistered).toEqual(sortedExpected);
    expect(registeredActionNames).toHaveLength(EXPECTED_ACTIONS.length);
  });
});
