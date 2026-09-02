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

import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import { createServiceFactory } from '@backstage/backend-plugin-api';
import { actionsRegistryServiceRef } from '@backstage/backend-plugin-api/alpha';
import { mcpKubernetesExtrasPlugin } from './plugin';

const EXPECTED_ACTIONS = [
  'get-kubernetes-clusters',
  'get-kubernetes-resources-for-entity',
];

describe('mcpKubernetesExtrasPlugin integration', () => {
  let registeredActionNames: string[];

  beforeAll(async () => {
    registeredActionNames = [];

    await startTestBackend({
      features: [
        mcpKubernetesExtrasPlugin,
        mockServices.rootLogger.factory(),
        mockServices.rootConfig.factory({
          data: {
            backend: { baseUrl: 'http://localhost:7007' },
          },
        }),
        mockServices.auth.factory(),
        mockServices.discovery.factory(),
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
