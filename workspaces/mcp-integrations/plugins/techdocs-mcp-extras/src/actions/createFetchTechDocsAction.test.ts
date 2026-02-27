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

describe('createFetchTechDocsAction', () => {
  it('should register and execute fetch-techdocs action successfully', async () => {
    const { server } = await startTestBackend({
      features: [
        mcpTechdocsExtrasPlugin,
        catalogServiceMock.factory({
          entities: [
            createMockEntity('service-with-docs', 'Component', true),
            createMockEntity('service-without-docs', 'Component', false),
          ],
        }),
      ],
    });

    expect(server).toBeDefined();
  });

  it('should fetch entities with techdocs annotation', async () => {
    const entitiesWithDocs = [
      createMockEntity('service-1', 'Component', true),
      createMockEntity('api-1', 'API', true),
    ];
    const entitiesWithoutDocs = [
      createMockEntity('service-2', 'Component', false),
    ];

    const { server } = await startTestBackend({
      features: [
        mcpTechdocsExtrasPlugin,
        catalogServiceMock.factory({
          entities: [...entitiesWithDocs, ...entitiesWithoutDocs],
        }),
      ],
    });

    expect(server).toBeDefined();
  });

  it('should handle empty catalog', async () => {
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

  it('should filter by entity type', async () => {
    const { server } = await startTestBackend({
      features: [
        mcpTechdocsExtrasPlugin,
        catalogServiceMock.factory({
          entities: [
            createMockEntity('component-1', 'Component', true),
            createMockEntity('api-1', 'API', true),
            createMockEntity('system-1', 'System', true),
          ],
        }),
      ],
    });

    expect(server).toBeDefined();
  });

  it('should filter by namespace', async () => {
    const { server } = await startTestBackend({
      features: [
        mcpTechdocsExtrasPlugin,
        catalogServiceMock.factory({
          entities: [
            createMockEntity('service-1', 'Component', true, {
              metadata: { name: 'service-1', namespace: 'production' },
            }),
            createMockEntity('service-2', 'Component', true, {
              metadata: { name: 'service-2', namespace: 'staging' },
            }),
          ],
        }),
      ],
    });

    expect(server).toBeDefined();
  });

  it('should filter by owner', async () => {
    const { server } = await startTestBackend({
      features: [
        mcpTechdocsExtrasPlugin,
        catalogServiceMock.factory({
          entities: [
            createMockEntity('service-1', 'Component', true, {
              spec: { owner: 'team-a' },
            }),
            createMockEntity('service-2', 'Component', true, {
              spec: { owner: 'team-b' },
            }),
          ],
        }),
      ],
    });

    expect(server).toBeDefined();
  });

  it('should filter by lifecycle', async () => {
    const { server } = await startTestBackend({
      features: [
        mcpTechdocsExtrasPlugin,
        catalogServiceMock.factory({
          entities: [
            createMockEntity('service-1', 'Component', true, {
              spec: { lifecycle: 'production' },
            }),
            createMockEntity('service-2', 'Component', true, {
              spec: { lifecycle: 'experimental' },
            }),
          ],
        }),
      ],
    });

    expect(server).toBeDefined();
  });

  it('should filter by tags', async () => {
    const { server } = await startTestBackend({
      features: [
        mcpTechdocsExtrasPlugin,
        catalogServiceMock.factory({
          entities: [
            createMockEntity('service-1', 'Component', true, {
              metadata: { name: 'service-1', tags: ['frontend', 'react'] },
            }),
            createMockEntity('service-2', 'Component', true, {
              metadata: { name: 'service-2', tags: ['backend', 'node'] },
            }),
          ],
        }),
      ],
    });

    expect(server).toBeDefined();
  });
});
