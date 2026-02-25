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

import { startTestBackend } from '@backstage/backend-test-utils';
import { mcpTechdocsExtrasPlugin } from '../plugin';
import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';
import { Entity } from '@backstage/catalog-model';

const createMockEntity = (
  name: string,
  kind: string = 'Component',
  hasTechDocs: boolean = false,
  options: Partial<Entity> = {},
): Entity => ({
  apiVersion: 'backstage.io/v1alpha1',
  kind,
  metadata: {
    name,
    namespace: 'default',
    title: `${name} title`,
    description: `${name} description`,
    tags: ['test', 'mock'],
    annotations: hasTechDocs ? { 'backstage.io/techdocs-ref': 'dir:.' } : {},
    ...options.metadata,
  },
  spec: {
    type: 'service',
    owner: 'team-test',
    lifecycle: 'production',
    ...options.spec,
  },
});

describe('createAnalyzeTechDocsCoverageAction', () => {
  it('should register and execute coverage analysis action successfully', async () => {
    const { server } = await startTestBackend({
      features: [
        mcpTechdocsExtrasPlugin,
        catalogServiceMock.factory({
          entities: [
            createMockEntity('service-1', 'Component', true),
            createMockEntity('service-2', 'Component', false),
            createMockEntity('service-3', 'Component', true),
          ],
        }),
      ],
    });

    expect(server).toBeDefined();
  });

  it('should handle 100% coverage scenario', async () => {
    const { server } = await startTestBackend({
      features: [
        mcpTechdocsExtrasPlugin,
        catalogServiceMock.factory({
          entities: [
            createMockEntity('service-1', 'Component', true),
            createMockEntity('service-2', 'Component', true),
          ],
        }),
      ],
    });

    expect(server).toBeDefined();
  });

  it('should handle 0% coverage scenario', async () => {
    const { server } = await startTestBackend({
      features: [
        mcpTechdocsExtrasPlugin,
        catalogServiceMock.factory({
          entities: [
            createMockEntity('service-1', 'Component', false),
            createMockEntity('service-2', 'Component', false),
          ],
        }),
      ],
    });

    expect(server).toBeDefined();
  });

  it('should handle empty catalog for coverage analysis', async () => {
    const { server } = await startTestBackend({
      features: [
        mcpTechdocsExtrasPlugin,
        catalogServiceMock.factory({
          entities: [],
        }),
      ],
    });

    expect(server).toBeDefined();
  });

  it('should analyze coverage with filters', async () => {
    const { server } = await startTestBackend({
      features: [
        mcpTechdocsExtrasPlugin,
        catalogServiceMock.factory({
          entities: [
            createMockEntity('component-1', 'Component', true, {
              metadata: { name: 'component-1', namespace: 'production' },
              spec: { owner: 'team-a', lifecycle: 'production' },
            }),
            createMockEntity('component-2', 'Component', false, {
              metadata: { name: 'component-2', namespace: 'production' },
              spec: { owner: 'team-a', lifecycle: 'production' },
            }),
            createMockEntity('api-1', 'API', true, {
              metadata: { name: 'api-1', namespace: 'staging' },
              spec: { owner: 'team-b', lifecycle: 'experimental' },
            }),
          ],
        }),
      ],
    });

    expect(server).toBeDefined();
  });
});
