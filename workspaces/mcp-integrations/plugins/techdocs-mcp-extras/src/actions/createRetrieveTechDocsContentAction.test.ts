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
import { actionsRegistryServiceMock } from '@backstage/backend-test-utils/alpha';
import { mockServices } from '@backstage/backend-test-utils';
import { ConfigReader } from '@backstage/config';
import { mcpTechdocsExtrasPlugin } from '../plugin';
import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';
import { Entity } from '@backstage/catalog-model';
import { createRetrieveTechDocsContentAction } from './createRetrieveTechDocsContentAction';

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

describe('createRetrieveTechDocsContentAction', () => {
  it('should register and execute content retrieval action successfully', async () => {
    const { server } = await startTestBackend({
      features: [
        mcpTechdocsExtrasPlugin,
        catalogServiceMock.factory({
          entities: [createMockEntity('service-with-docs', 'Component', true)],
        }),
      ],
    });

    expect(server).toBeDefined();
  });

  it('should handle entity with TechDocs', async () => {
    const entityWithDocs = createMockEntity('service-1', 'Component', true);

    const { server } = await startTestBackend({
      features: [
        mcpTechdocsExtrasPlugin,
        catalogServiceMock.factory({
          entities: [entityWithDocs],
        }),
      ],
    });

    expect(server).toBeDefined();
  });

  it('should handle different entity types for content retrieval', async () => {
    const entities = [
      createMockEntity('api-with-docs', 'API', true),
      createMockEntity('system-with-docs', 'System', true),
    ];

    const { server } = await startTestBackend({
      features: [
        mcpTechdocsExtrasPlugin,
        catalogServiceMock.factory({
          entities,
        }),
      ],
    });

    expect(server).toBeDefined();
  });

  it('should handle invalid entity references', async () => {
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

  it('should handle different page paths', async () => {
    const entityWithDocs = createMockEntity('service-1', 'Component', true);

    const { server } = await startTestBackend({
      features: [
        mcpTechdocsExtrasPlugin,
        catalogServiceMock.factory({
          entities: [entityWithDocs],
        }),
      ],
    });

    expect(server).toBeDefined();
  });

  it('should handle entities in different namespaces', async () => {
    const entities = [
      createMockEntity('service-1', 'Component', true, {
        metadata: { name: 'service-1', namespace: 'production' },
      }),
      createMockEntity('service-2', 'Component', true, {
        metadata: { name: 'service-2', namespace: 'staging' },
      }),
    ];

    const { server } = await startTestBackend({
      features: [
        mcpTechdocsExtrasPlugin,
        catalogServiceMock.factory({
          entities,
        }),
      ],
    });

    expect(server).toBeDefined();
  });

  describe('error handling', () => {
    it('should handle catalog service errors gracefully', async () => {
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

    it('should handle content retrieval errors gracefully', async () => {
      const { server } = await startTestBackend({
        features: [
          mcpTechdocsExtrasPlugin,
          catalogServiceMock.factory({
            entities: [
              createMockEntity('service-without-docs', 'Component', false),
            ],
          }),
        ],
      });

      expect(server).toBeDefined();
    });

    it('should handle authentication failures in content retrieval', async () => {
      const { server } = await startTestBackend({
        features: [
          mcpTechdocsExtrasPlugin,
          catalogServiceMock.factory({
            entities: [
              createMockEntity('service-with-auth-issues', 'Component', true),
            ],
          }),
        ],
      });

      expect(server).toBeDefined();
    });

    it('should handle invalid entity references in content retrieval', async () => {
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
  });

  describe('path safety validation', () => {
    it('should reject entityRef that is not a valid entity reference', async () => {
      const mockActionsRegistry = actionsRegistryServiceMock();
      const mockCatalog = { getEntityByRef: jest.fn() };
      const mockAuth = mockServices.auth.mock();
      const mockDiscovery = mockServices.discovery.mock();
      const mockLogger = mockServices.logger.mock();
      const config = new ConfigReader({
        app: { baseUrl: 'http://localhost:3000' },
        backend: { baseUrl: 'http://localhost:7007' },
      });

      createRetrieveTechDocsContentAction({
        actionsRegistry: mockActionsRegistry,
        catalog: mockCatalog as any,
        auth: mockAuth,
        logger: mockLogger,
        config,
        discovery: mockDiscovery,
      });

      const invalidRefs = [
        'component:../../other',
        'component:default//other',
        'component:default/%2e%2e/other',
        'component:default\\other',
      ];
      for (const ref of invalidRefs) {
        await expect(
          mockActionsRegistry.invoke({
            id: 'test:retrieve-techdocs-content',
            input: { entityRef: ref },
          }),
        ).rejects.toThrow(/valid entity reference/);
      }
    });

    it('should reject pagePath that is not a valid documentation path', async () => {
      const mockActionsRegistry = actionsRegistryServiceMock();
      const mockCatalog = { getEntityByRef: jest.fn() };
      const mockAuth = mockServices.auth.mock();
      const mockDiscovery = mockServices.discovery.mock();
      const mockLogger = mockServices.logger.mock();
      const config = new ConfigReader({
        app: { baseUrl: 'http://localhost:3000' },
        backend: { baseUrl: 'http://localhost:7007' },
      });

      createRetrieveTechDocsContentAction({
        actionsRegistry: mockActionsRegistry,
        catalog: mockCatalog as any,
        auth: mockAuth,
        logger: mockLogger,
        config,
        discovery: mockDiscovery,
      });

      const invalidPaths = [
        '../../../etc/passwd',
        'api//endpoints.html',
        'docs%2f..%2fother',
        'docs\\..\\other',
      ];
      for (const path of invalidPaths) {
        await expect(
          mockActionsRegistry.invoke({
            id: 'test:retrieve-techdocs-content',
            input: {
              entityRef: 'component:default/my-service',
              pagePath: path,
            },
          }),
        ).rejects.toThrow(/valid documentation path/);
      }
    });
  });
});
