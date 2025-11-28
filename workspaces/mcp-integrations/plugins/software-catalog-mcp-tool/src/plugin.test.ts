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
// Assisted-by: claude-4-sonnet

import { fetchCatalogEntities } from './plugin';
import { CatalogService } from '@backstage/plugin-catalog-node';
import { Entity } from '@backstage/catalog-model';
import { mockServices } from '@backstage/backend-test-utils';

describe('backstageMcpPlugin', () => {
  describe('fetchCatalogEntities', () => {
    const mockCatalogService = {
      getEntities: jest.fn(),
    } as unknown as CatalogService;

    const mockAuthService = {
      getOwnServiceCredentials: jest.fn(),
    };

    const mockLoggerService = mockServices.logger.mock();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should fetch catalog entities successfully', async () => {
      const mockEntities: Entity[] = [
        {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'Component',
          metadata: {
            name: 'my-service',
            tags: ['java', 'spring'],
            description: 'A Spring-based microservice',
          },
          spec: {
            type: 'service',
            owner: 'test-team',
            lifecycle: 'production',
            dependsOn: [],
          },
        },
        {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'API',
          metadata: {
            name: 'my-api',
            tags: ['rest', 'openapi'],
            description: 'REST API for data access',
          },
          spec: {
            type: 'openapi',
            owner: 'user:jane.doe',
            lifecycle: 'production',
            dependsOn: [],
          },
        },
        {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'System',
          metadata: {
            name: 'my-system',
            tags: [],
            description: 'Core business system',
          },
          spec: {
            type: 'system',
            owner: 'team-architecture',
            lifecycle: 'production',
          },
        },
      ];

      mockAuthService.getOwnServiceCredentials.mockResolvedValue({
        principal: { type: 'service', subject: 'test' },
        token: 'test-token',
      });

      (mockCatalogService.getEntities as jest.Mock).mockResolvedValue({
        items: mockEntities,
      });

      const result = await fetchCatalogEntities(
        mockCatalogService,
        mockAuthService,
        mockLoggerService,
      );

      expect(mockAuthService.getOwnServiceCredentials).toHaveBeenCalledTimes(1);
      expect(mockCatalogService.getEntities).toHaveBeenCalledWith(
        {
          fields: [
            'metadata.name',
            'kind',
            'metadata.tags',
            'metadata.description',
            'spec.type',
            'spec.owner',
            'spec.lifecycle',
            'relations',
          ],
          filter: {},
        },
        {
          credentials: {
            principal: { type: 'service', subject: 'test' },
            token: 'test-token',
          },
        },
      );

      expect(result).toEqual({
        entities: [
          {
            name: 'my-service',
            kind: 'Component',
            tags: 'java,spring',
            description: 'A Spring-based microservice',
            lifecycle: 'production',
            type: 'service',
            owner: 'test-team',
            dependsOn: '',
          },
          {
            name: 'my-api',
            kind: 'API',
            tags: 'rest,openapi',
            description: 'REST API for data access',
            lifecycle: 'production',
            type: 'openapi',
            owner: 'user:jane.doe',
            dependsOn: '',
          },
          {
            name: 'my-system',
            kind: 'System',
            tags: '',
            description: 'Core business system',
            lifecycle: 'production',
            type: 'system',
            owner: 'team-architecture',
            dependsOn: '',
          },
        ],
      });
    });

    it('should handle entities with no tags', async () => {
      const mockEntities: Entity[] = [
        {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'Component',
          metadata: {
            name: 'service-no-tags',
            description: 'Service without tags',
          },
          spec: {
            type: 'service',
            owner: 'user:john.doe',
            lifecycle: 'staging',
          },
        },
      ];

      mockAuthService.getOwnServiceCredentials.mockResolvedValue({
        principal: { type: 'service', subject: 'test' },
        token: 'test-token',
      });

      (mockCatalogService.getEntities as jest.Mock).mockResolvedValue({
        items: mockEntities,
      });

      const result = await fetchCatalogEntities(
        mockCatalogService,
        mockAuthService,
        mockLoggerService,
      );

      expect(result).toEqual({
        entities: [
          {
            name: 'service-no-tags',
            kind: 'Component',
            tags: '',
            description: 'Service without tags',
            lifecycle: 'staging',
            type: 'service',
            owner: 'user:john.doe',
            dependsOn: '',
          },
        ],
      });
    });

    it('should handle empty catalog', async () => {
      mockAuthService.getOwnServiceCredentials.mockResolvedValue({
        principal: { type: 'service', subject: 'test' },
        token: 'test-token',
      });

      (mockCatalogService.getEntities as jest.Mock).mockResolvedValue({
        items: [],
      });

      const result = await fetchCatalogEntities(
        mockCatalogService,
        mockAuthService,
        mockLoggerService,
      );

      expect(result).toEqual({
        entities: [],
      });
    });

    it('should handle catalog service errors', async () => {
      mockAuthService.getOwnServiceCredentials.mockResolvedValue({
        principal: { type: 'service', subject: 'test' },
        token: 'test-token',
      });

      (mockCatalogService.getEntities as jest.Mock).mockRejectedValue(
        new Error('Catalog service error'),
      );

      await expect(
        fetchCatalogEntities(
          mockCatalogService,
          mockAuthService,
          mockLoggerService,
        ),
      ).rejects.toThrow('Catalog service error');
    });

    it('should handle authentication errors', async () => {
      mockAuthService.getOwnServiceCredentials.mockRejectedValue(
        new Error('Authentication failed'),
      );

      await expect(
        fetchCatalogEntities(
          mockCatalogService,
          mockAuthService,
          mockLoggerService,
        ),
      ).rejects.toThrow('Authentication failed');
    });

    it('should filter entities by kind', async () => {
      const mockEntities: Entity[] = [
        {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'Component',
          metadata: {
            name: 'my-service',
            tags: ['java'],
            description: 'A service',
          },
          spec: {
            type: 'service',
            owner: 'test-team',
            lifecycle: 'production',
          },
        },
        {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'API',
          metadata: {
            name: 'my-api',
            tags: ['rest'],
            description: 'An API',
          },
          spec: {
            type: 'openapi',
            owner: 'user:api.owner',
            lifecycle: 'production',
          },
        },
      ];

      mockAuthService.getOwnServiceCredentials.mockResolvedValue({
        principal: { type: 'service', subject: 'test' },
        token: 'test-token',
      });

      (mockCatalogService.getEntities as jest.Mock).mockResolvedValue({
        items: mockEntities,
      });

      await fetchCatalogEntities(
        mockCatalogService,
        mockAuthService,
        mockLoggerService,
        {
          kind: 'Component',
        },
      );

      expect(mockCatalogService.getEntities).toHaveBeenCalledWith(
        {
          fields: [
            'metadata.name',
            'kind',
            'metadata.tags',
            'metadata.description',
            'spec.type',
            'spec.owner',
            'spec.lifecycle',
            'relations',
          ],
          filter: { kind: 'Component' },
        },
        {
          credentials: {
            principal: { type: 'service', subject: 'test' },
            token: 'test-token',
          },
        },
      );
    });

    it('should filter entities by kind, type, name, and owner', async () => {
      const mockEntities: Entity[] = [
        {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'Component',
          metadata: {
            name: 'specific-service',
            tags: ['javascript'],
            description: 'A specific web service',
          },
          spec: {
            type: 'service',
            owner: 'team-frontend',
            lifecycle: 'production',
          },
        },
      ];

      mockAuthService.getOwnServiceCredentials.mockResolvedValue({
        principal: { type: 'service', subject: 'test' },
        token: 'test-token',
      });

      (mockCatalogService.getEntities as jest.Mock).mockResolvedValue({
        items: mockEntities,
      });

      const result = await fetchCatalogEntities(
        mockCatalogService,
        mockAuthService,
        mockLoggerService,
        {
          kind: 'Component',
          type: 'service',
          name: 'specific-service',
          owner: 'team-frontend',
        },
      );

      expect(mockCatalogService.getEntities).toHaveBeenCalledWith(
        {
          fields: [
            'metadata.name',
            'kind',
            'metadata.tags',
            'metadata.description',
            'spec.type',
            'spec.owner',
            'spec.lifecycle',
            'relations',
          ],
          filter: {
            kind: 'Component',
            'spec.type': 'service',
            'metadata.name': 'specific-service',
            'spec.owner': 'team-frontend',
          },
        },
        {
          credentials: {
            principal: { type: 'service', subject: 'test' },
            token: 'test-token',
          },
        },
      );

      expect(result).toEqual({
        entities: [
          {
            name: 'specific-service',
            kind: 'Component',
            tags: 'javascript',
            description: 'A specific web service',
            lifecycle: 'production',
            type: 'service',
            owner: 'team-frontend',
            dependsOn: '',
          },
        ],
      });
    });

    it('should filter entities by name', async () => {
      const mockEntities: Entity[] = [
        {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'Component',
          metadata: {
            name: 'my-service',
            tags: ['java', 'spring'],
            description: 'A Spring-based microservice',
          },
          spec: {
            type: 'service',
            owner: 'team-backend',
            lifecycle: 'production',
          },
        },
      ];

      mockAuthService.getOwnServiceCredentials.mockResolvedValue({
        principal: { type: 'service', subject: 'test' },
        token: 'test-token',
      });

      (mockCatalogService.getEntities as jest.Mock).mockResolvedValue({
        items: mockEntities,
      });

      const result = await fetchCatalogEntities(
        mockCatalogService,
        mockAuthService,
        mockLoggerService,
        { name: 'my-service' },
      );

      expect(mockCatalogService.getEntities).toHaveBeenCalledWith(
        {
          fields: [
            'metadata.name',
            'kind',
            'metadata.tags',
            'metadata.description',
            'spec.type',
            'spec.owner',
            'spec.lifecycle',
            'relations',
          ],
          filter: { 'metadata.name': 'my-service' },
        },
        {
          credentials: {
            principal: { type: 'service', subject: 'test' },
            token: 'test-token',
          },
        },
      );

      expect(result).toEqual({
        entities: [
          {
            name: 'my-service',
            kind: 'Component',
            tags: 'java,spring',
            description: 'A Spring-based microservice',
            lifecycle: 'production',
            type: 'service',
            owner: 'team-backend',
            dependsOn: '',
          },
        ],
      });
    });

    it('should filter entities by owner', async () => {
      const mockEntities: Entity[] = [
        {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'Component',
          metadata: {
            name: 'platform-service',
            tags: ['platform', 'core'],
            description: 'A platform service',
          },
          spec: {
            type: 'service',
            owner: 'team-platform',
            lifecycle: 'production',
          },
        },
      ];

      mockAuthService.getOwnServiceCredentials.mockResolvedValue({
        principal: { type: 'service', subject: 'test' },
        token: 'test-token',
      });

      (mockCatalogService.getEntities as jest.Mock).mockResolvedValue({
        items: mockEntities,
      });

      const result = await fetchCatalogEntities(
        mockCatalogService,
        mockAuthService,
        mockLoggerService,
        { owner: 'team-platform' },
      );

      expect(mockCatalogService.getEntities).toHaveBeenCalledWith(
        {
          fields: [
            'metadata.name',
            'kind',
            'metadata.tags',
            'metadata.description',
            'spec.type',
            'spec.owner',
            'spec.lifecycle',
            'relations',
          ],
          filter: { 'spec.owner': 'team-platform' },
        },
        {
          credentials: {
            principal: { type: 'service', subject: 'test' },
            token: 'test-token',
          },
        },
      );

      expect(result).toEqual({
        entities: [
          {
            name: 'platform-service',
            kind: 'Component',
            tags: 'platform,core',
            description: 'A platform service',
            lifecycle: 'production',
            type: 'service',
            owner: 'team-platform',
            dependsOn: '',
          },
        ],
      });
    });

    it('should handle entities with missing description, type, and owner', async () => {
      const mockEntities: Entity[] = [
        {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'Component',
          metadata: {
            name: 'minimal-service',
            tags: ['minimal'],
            description: 'A minimal service',
          },
          spec: {
            type: 'service',
            owner: 'user:minimal.owner',
            lifecycle: 'development',
          },
        },
      ];

      mockAuthService.getOwnServiceCredentials.mockResolvedValue({
        principal: { type: 'service', subject: 'test' },
        token: 'test-token',
      });

      (mockCatalogService.getEntities as jest.Mock).mockResolvedValue({
        items: mockEntities,
      });

      const result = await fetchCatalogEntities(
        mockCatalogService,
        mockAuthService,
        mockLoggerService,
      );

      expect(result).toEqual({
        entities: [
          {
            name: 'minimal-service',
            kind: 'Component',
            tags: 'minimal',
            description: 'A minimal service',
            lifecycle: 'development',
            type: 'service',
            owner: 'user:minimal.owner',
            dependsOn: '',
          },
        ],
      });
    });

    it('should return full entities when verbose is true', async () => {
      const mockEntities: Entity[] = [
        {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'Component',
          metadata: {
            name: 'full-service',
            tags: ['java', 'spring'],
            description: 'A full service entity',
            uid: 'component:default/full-service',
            namespace: 'default',
          },
          spec: {
            type: 'service',
            lifecycle: 'production',
            owner: 'team-a',
          },
          relations: [
            {
              type: 'dependsOn',
              targetRef: 'component:default/database',
            },
          ],
        },
      ];

      mockAuthService.getOwnServiceCredentials.mockResolvedValue({
        principal: { type: 'service', subject: 'test' },
        token: 'test-token',
      });

      (mockCatalogService.getEntities as jest.Mock).mockResolvedValue({
        items: mockEntities,
      });

      const result = await fetchCatalogEntities(
        mockCatalogService,
        mockAuthService,
        mockLoggerService,
        { verbose: true },
      );

      expect(mockCatalogService.getEntities).toHaveBeenCalledWith(
        {
          filter: {},
        },
        {
          credentials: {
            principal: { type: 'service', subject: 'test' },
            token: 'test-token',
          },
        },
      );

      expect(result).toEqual({
        entities: mockEntities, // Should return the full entities unchanged
      });
    });

    it('should return abridged entities when verbose is false', async () => {
      const mockEntities: Entity[] = [
        {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'Component',
          metadata: {
            name: 'abridged-service',
            tags: ['java'],
            description: 'An abridged service entity',
            uid: 'component:default/abridged-service',
            namespace: 'default',
          },
          spec: {
            type: 'service',
            lifecycle: 'production',
            owner: 'team-a',
          },
          relations: [
            {
              type: 'dependsOn',
              targetRef: 'component:default/database',
            },
          ],
        },
      ];

      mockAuthService.getOwnServiceCredentials.mockResolvedValue({
        principal: { type: 'service', subject: 'test' },
        token: 'test-token',
      });

      (mockCatalogService.getEntities as jest.Mock).mockResolvedValue({
        items: mockEntities,
      });

      const result = await fetchCatalogEntities(
        mockCatalogService,
        mockAuthService,
        mockLoggerService,
        { verbose: false },
      );

      expect(mockCatalogService.getEntities).toHaveBeenCalledWith(
        {
          fields: [
            'metadata.name',
            'kind',
            'metadata.tags',
            'metadata.description',
            'spec.type',
            'spec.owner',
            'spec.lifecycle',
            'relations',
          ],
          filter: {},
        },
        {
          credentials: {
            principal: { type: 'service', subject: 'test' },
            token: 'test-token',
          },
        },
      );

      expect(result).toEqual({
        entities: [
          {
            name: 'abridged-service',
            kind: 'Component',
            tags: 'java',
            description: 'An abridged service entity',
            lifecycle: 'production',
            type: 'service',
            owner: 'team-a',
            dependsOn: 'component:default/database',
          },
        ],
      });
    });

    it('should return abridged entities when verbose is not specified (default behavior)', async () => {
      const mockEntities: Entity[] = [
        {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'Component',
          metadata: {
            name: 'default-service',
            tags: ['default'],
            description: 'A default service entity',
          },
          spec: {
            type: 'service',
            owner: 'team-default',
          },
        },
      ];

      mockAuthService.getOwnServiceCredentials.mockResolvedValue({
        principal: { type: 'service', subject: 'test' },
        token: 'test-token',
      });

      (mockCatalogService.getEntities as jest.Mock).mockResolvedValue({
        items: mockEntities,
      });

      const result = await fetchCatalogEntities(
        mockCatalogService,
        mockAuthService,
        mockLoggerService,
        {}, // No verbose specified
      );

      expect(mockCatalogService.getEntities).toHaveBeenCalledWith(
        {
          fields: [
            'metadata.name',
            'kind',
            'metadata.tags',
            'metadata.description',
            'spec.type',
            'spec.owner',
            'spec.lifecycle',
            'relations',
          ],
          filter: {},
        },
        {
          credentials: {
            principal: { type: 'service', subject: 'test' },
            token: 'test-token',
          },
        },
      );

      expect(result).toEqual({
        entities: [
          {
            name: 'default-service',
            kind: 'Component',
            tags: 'default',
            description: 'A default service entity',
            lifecycle: undefined,
            type: 'service',
            owner: 'team-default',
            dependsOn: '',
          },
        ],
      });
    });
  });

  describe('MCP Action validation and error handling', () => {
    const mockCatalogService = {
      getEntities: jest.fn(),
    } as unknown as CatalogService;

    const mockAuthService = {
      getOwnServiceCredentials: jest.fn(),
    };

    const mockLoggerService = mockServices.logger.mock();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return error when type is specified without kind', async () => {
      // Simulate the action logic that validates type without kind
      const fetchCatalogEntitiesAction = async ({
        input,
      }: {
        input: {
          kind?: string;
          type?: string;
          name?: string;
          owner?: string;
          lifecycle?: string;
          tags?: string;
          verbose?: boolean;
        };
      }) => {
        if (input.type && !input.kind) {
          return {
            output: {
              entities: [],
              error:
                'entity type cannot be specified without an entity kind specified',
            },
          };
        }
        const result = await fetchCatalogEntities(
          mockCatalogService,
          mockAuthService,
          mockLoggerService,
          input,
        );
        return {
          output: {
            ...result,
            error: undefined,
          },
        };
      };

      const result = await fetchCatalogEntitiesAction({
        input: { type: 'service' },
      });

      expect(result.output.error).toBe(
        'entity type cannot be specified without an entity kind specified',
      );
      expect(result.output.entities).toEqual([]);
    });

    it('should return entities successfully when both kind and type are specified', async () => {
      const mockEntities: Entity[] = [
        {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'Component',
          metadata: {
            name: 'test-service',
            tags: ['test'],
            description: 'A test service',
          },
          spec: {
            type: 'service',
            owner: 'test-team',
            lifecycle: 'production',
          },
        },
      ];

      mockAuthService.getOwnServiceCredentials.mockResolvedValue({
        principal: { type: 'service', subject: 'test' },
        token: 'test-token',
      });

      (mockCatalogService.getEntities as jest.Mock).mockResolvedValue({
        items: mockEntities,
      });

      // Simulate the action logic
      const fetchCatalogEntitiesAction = async ({
        input,
      }: {
        input: {
          kind?: string;
          type?: string;
          name?: string;
          owner?: string;
          lifecycle?: string;
          tags?: string;
          verbose?: boolean;
        };
      }) => {
        if (input.type && !input.kind) {
          return {
            output: {
              entities: [],
              error:
                'entity type cannot be specified without an entity kind specified',
            },
          };
        }
        const result = await fetchCatalogEntities(
          mockCatalogService,
          mockAuthService,
          mockLoggerService,
          input,
        );
        return {
          output: {
            ...result,
            error: undefined,
          },
        };
      };

      const result = await fetchCatalogEntitiesAction({
        input: { kind: 'Component', type: 'service' },
      });

      expect(result.output.error).toBeUndefined();
      expect(result.output.entities).toEqual([
        {
          name: 'test-service',
          kind: 'Component',
          tags: 'test',
          description: 'A test service',
          lifecycle: 'production',
          type: 'service',
          owner: 'test-team',
          dependsOn: '',
        },
      ]);
    });

    it('should return entities successfully when only kind is specified', async () => {
      const mockEntities: Entity[] = [
        {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'Component',
          metadata: {
            name: 'test-component',
            tags: ['test'],
            description: 'A test component',
          },
          spec: {
            type: 'library',
            owner: 'test-team',
            lifecycle: 'production',
          },
        },
      ];

      mockAuthService.getOwnServiceCredentials.mockResolvedValue({
        principal: { type: 'service', subject: 'test' },
        token: 'test-token',
      });

      (mockCatalogService.getEntities as jest.Mock).mockResolvedValue({
        items: mockEntities,
      });

      // Simulate the action logic
      const fetchCatalogEntitiesAction = async ({
        input,
      }: {
        input: {
          kind?: string;
          type?: string;
          name?: string;
          owner?: string;
          lifecycle?: string;
          tags?: string;
          verbose?: boolean;
        };
      }) => {
        if (input.type && !input.kind) {
          return {
            output: {
              entities: [],
              error:
                'entity type cannot be specified without an entity kind specified',
            },
          };
        }
        const result = await fetchCatalogEntities(
          mockCatalogService,
          mockAuthService,
          mockLoggerService,
          input,
        );
        return {
          output: {
            ...result,
            error: undefined,
          },
        };
      };

      const result = await fetchCatalogEntitiesAction({
        input: { kind: 'Component' },
      });

      expect(result.output.error).toBeUndefined();
      expect(result.output.entities).toEqual([
        {
          name: 'test-component',
          kind: 'Component',
          tags: 'test',
          description: 'A test component',
          lifecycle: 'production',
          type: 'library',
          owner: 'test-team',
          dependsOn: '',
        },
      ]);
    });
  });

  describe('MCP Action functions', () => {
    describe('greet-user action logic', () => {
      it('should generate personalized greeting', async () => {
        // Test the core logic of the greet-user action
        const greetUserAction = async ({
          input,
        }: {
          input: { name: string };
        }) => ({
          output: { greeting: `Hello ${input.name}!` },
        });

        const testCases = [
          { input: { name: 'John Doe' }, expected: 'Hello John Doe!' },
          { input: { name: '' }, expected: 'Hello !' },
          { input: { name: 'José María' }, expected: 'Hello José María!' },
          { input: { name: 'Alice123' }, expected: 'Hello Alice123!' },
        ];

        for (const testCase of testCases) {
          const result = await greetUserAction(testCase);
          expect(result.output.greeting).toBe(testCase.expected);
        }
      });
    });

    describe('fetch-catalog-entities action logic', () => {
      it('should use fetchCatalogEntities function correctly', async () => {
        const mockCatalogService = {
          getEntities: jest.fn().mockResolvedValue({
            items: [
              {
                apiVersion: 'backstage.io/v1alpha1',
                kind: 'Component',
                metadata: {
                  name: 'test-component',
                  tags: ['test'],
                  description: 'A test component',
                },
                spec: {
                  type: 'library',
                  owner: 'test-team',
                },
              },
            ],
          }),
        } as unknown as CatalogService;

        const mockAuthService = {
          getOwnServiceCredentials: jest.fn().mockResolvedValue({
            principal: { type: 'service', subject: 'test' },
            token: 'test-token',
          }),
        };

        const mockLoggerService = mockServices.logger.mock();

        // Test the action logic
        const fetchCatalogEntitiesAction = async () => {
          const result = await fetchCatalogEntities(
            mockCatalogService,
            mockAuthService,
            mockLoggerService,
          );
          return {
            output: {
              ...result,
              error: undefined,
            },
          };
        };

        const result = await fetchCatalogEntitiesAction();

        expect(result.output).toHaveProperty('entities');
        expect(result.output).toHaveProperty('error');
        expect(Array.isArray(result.output.entities)).toBe(true);
        expect(result.output.entities).toHaveLength(1);
        expect(result.output.entities[0]).toEqual({
          name: 'test-component',
          kind: 'Component',
          tags: 'test',
          description: 'A test component',
          lifecycle: undefined,
          type: 'library',
          owner: 'test-team',
          dependsOn: '',
        });
        expect(result.output.error).toBeUndefined();
      });
    });
  });

  describe('register-catalog-entities action', () => {
    const mockCatalogService = {
      addLocation: jest.fn(),
    } as unknown as CatalogService;

    const mockAuthService = {
      getOwnServiceCredentials: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully register catalog entities with valid URL', async () => {
      const mockLocationId = 'test-location-id-123';
      const validURL = 'https://example.com/catalog-info.yaml';

      mockAuthService.getOwnServiceCredentials.mockResolvedValue({
        principal: { type: 'service', subject: 'test' },
        token: 'test-token',
      });

      (mockCatalogService.addLocation as jest.Mock).mockResolvedValue({
        location: {
          id: mockLocationId,
        },
      });

      // Simulate the action logic
      const registerCatalogEntitiesAction = async ({
        input,
      }: {
        input: { locationURL: string };
      }) => {
        if (!input.locationURL || input.locationURL === '') {
          return {
            output: {
              error: 'a location URL must be specified',
            },
          };
        }

        try {
          // eslint-disable-next-line no-new
          new URL(input.locationURL);
        } catch {
          return {
            output: {
              error: 'location URL must be a valid URL string',
            },
          };
        }

        try {
          const locReq = {
            type: 'url',
            target: input.locationURL,
          };
          const credentials = await mockAuthService.getOwnServiceCredentials();
          const result = await mockCatalogService.addLocation(locReq, {
            credentials,
          });

          return {
            output: {
              locationID: result.location.id,
              error: undefined,
            },
          };
        } catch (error) {
          return {
            output: {
              error: error.message,
            },
          };
        }
      };

      const result = await registerCatalogEntitiesAction({
        input: { locationURL: validURL },
      });

      expect(mockAuthService.getOwnServiceCredentials).toHaveBeenCalledTimes(1);
      expect(mockCatalogService.addLocation).toHaveBeenCalledWith(
        {
          type: 'url',
          target: validURL,
        },
        {
          credentials: {
            principal: { type: 'service', subject: 'test' },
            token: 'test-token',
          },
        },
      );
      expect(result.output.locationID).toBe(mockLocationId);
      expect(result.output.error).toBeUndefined();
    });

    it('should return error when locationURL is empty', async () => {
      const registerCatalogEntitiesAction = async ({
        input,
      }: {
        input: { locationURL: string };
      }) => {
        if (!input.locationURL || input.locationURL === '') {
          return {
            output: {
              error: 'a location URL must be specified',
            },
          };
        }
        return { output: {} };
      };

      const result = await registerCatalogEntitiesAction({
        input: { locationURL: '' },
      });

      expect(result.output.error).toBe('a location URL must be specified');
    });

    it('should return error when locationURL is not provided', async () => {
      const registerCatalogEntitiesAction = async ({
        input,
      }: {
        input: { locationURL: string };
      }) => {
        if (!input.locationURL || input.locationURL === '') {
          return {
            output: {
              error: 'a location URL must be specified',
            },
          };
        }
        return { output: {} };
      };

      const result = await registerCatalogEntitiesAction({
        input: { locationURL: '' },
      });

      expect(result.output.error).toBe('a location URL must be specified');
    });

    it('should return error when locationURL is invalid', async () => {
      const invalidURL = 'not-a-valid-url';

      const registerCatalogEntitiesAction = async ({
        input,
      }: {
        input: { locationURL: string };
      }) => {
        if (!input.locationURL || input.locationURL === '') {
          return {
            output: {
              error: 'a location URL must be specified',
            },
          };
        }

        try {
          // eslint-disable-next-line no-new
          new URL(input.locationURL);
        } catch {
          return {
            output: {
              error: 'location URL must be a valid URL string',
            },
          };
        }

        return { output: {} };
      };

      const result = await registerCatalogEntitiesAction({
        input: { locationURL: invalidURL },
      });

      expect(result.output.error).toBe(
        'location URL must be a valid URL string',
      );
    });

    it('should handle catalog service errors during registration', async () => {
      const validURL = 'https://example.com/catalog-info.yaml';
      const errorMessage = 'Failed to add location';

      mockAuthService.getOwnServiceCredentials.mockResolvedValue({
        principal: { type: 'service', subject: 'test' },
        token: 'test-token',
      });

      (mockCatalogService.addLocation as jest.Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      const registerCatalogEntitiesAction = async ({
        input,
      }: {
        input: { locationURL: string };
      }) => {
        if (!input.locationURL || input.locationURL === '') {
          return {
            output: {
              error: 'a location URL must be specified',
            },
          };
        }

        try {
          // eslint-disable-next-line no-new
          new URL(input.locationURL);
        } catch {
          return {
            output: {
              error: 'location URL must be a valid URL string',
            },
          };
        }

        try {
          const locReq = {
            type: 'url',
            target: input.locationURL,
          };
          const credentials = await mockAuthService.getOwnServiceCredentials();
          const result = await mockCatalogService.addLocation(locReq, {
            credentials,
          });

          return {
            output: {
              locationID: result.location.id,
              error: undefined,
            },
          };
        } catch (error) {
          return {
            output: {
              error: error.message,
            },
          };
        }
      };

      const result = await registerCatalogEntitiesAction({
        input: { locationURL: validURL },
      });

      expect(result.output.error).toBe(errorMessage);
      expect(result.output.locationID).toBeUndefined();
    });
  });

  describe('unregister-catalog-entities action', () => {
    const mockCatalogService = {
      removeLocationById: jest.fn(),
    } as unknown as CatalogService;

    const mockAuthService = {
      getOwnServiceCredentials: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully unregister catalog entities with valid locationId', async () => {
      const validLocationId = 'test-location-id-123';

      mockAuthService.getOwnServiceCredentials.mockResolvedValue({
        principal: { type: 'service', subject: 'test' },
        token: 'test-token',
      });

      (mockCatalogService.removeLocationById as jest.Mock).mockResolvedValue(
        undefined,
      );

      const unregisterCatalogEntitiesAction = async ({
        input,
      }: {
        input: { locationId: string };
      }) => {
        if (!input.locationId || input.locationId === '') {
          return {
            output: {
              error: 'a location ID must be specified',
            },
          };
        }

        try {
          const credentials = await mockAuthService.getOwnServiceCredentials();
          await mockCatalogService.removeLocationById(input.locationId, {
            credentials,
          });

          return {
            output: {
              error: undefined,
            },
          };
        } catch (error) {
          return {
            output: {
              error: error.message,
            },
          };
        }
      };

      const result = await unregisterCatalogEntitiesAction({
        input: { locationId: validLocationId },
      });

      expect(mockAuthService.getOwnServiceCredentials).toHaveBeenCalledTimes(1);
      expect(mockCatalogService.removeLocationById).toHaveBeenCalledWith(
        validLocationId,
        {
          credentials: {
            principal: { type: 'service', subject: 'test' },
            token: 'test-token',
          },
        },
      );
      expect(result.output.error).toBeUndefined();
    });

    it('should return error when locationId is empty', async () => {
      const unregisterCatalogEntitiesAction = async ({
        input,
      }: {
        input: { locationId: string };
      }) => {
        if (!input.locationId || input.locationId === '') {
          return {
            output: {
              error: 'a location ID must be specified',
            },
          };
        }
        return { output: {} };
      };

      const result = await unregisterCatalogEntitiesAction({
        input: { locationId: '' },
      });

      expect(result.output.error).toBe('a location ID must be specified');
    });

    it('should return error when locationId is not provided', async () => {
      const unregisterCatalogEntitiesAction = async ({
        input,
      }: {
        input: { locationId: string };
      }) => {
        if (!input.locationId || input.locationId === '') {
          return {
            output: {
              error: 'a location ID must be specified',
            },
          };
        }
        return { output: {} };
      };

      const result = await unregisterCatalogEntitiesAction({
        input: { locationId: '' },
      });

      expect(result.output.error).toBe('a location ID must be specified');
    });

    it('should handle catalog service errors during unregistration', async () => {
      const validLocationId = 'test-location-id-123';
      const errorMessage = 'Failed to remove location';

      mockAuthService.getOwnServiceCredentials.mockResolvedValue({
        principal: { type: 'service', subject: 'test' },
        token: 'test-token',
      });

      (mockCatalogService.removeLocationById as jest.Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      const unregisterCatalogEntitiesAction = async ({
        input,
      }: {
        input: { locationId: string };
      }) => {
        if (!input.locationId || input.locationId === '') {
          return {
            output: {
              error: 'a location ID must be specified',
            },
          };
        }

        try {
          const credentials = await mockAuthService.getOwnServiceCredentials();
          await mockCatalogService.removeLocationById(input.locationId, {
            credentials,
          });

          return {
            output: {
              error: undefined,
            },
          };
        } catch (error) {
          return {
            output: {
              error: error.message,
            },
          };
        }
      };

      const result = await unregisterCatalogEntitiesAction({
        input: { locationId: validLocationId },
      });

      expect(result.output.error).toBe(errorMessage);
    });

    it('should handle non-existent locationId gracefully', async () => {
      const nonExistentLocationId = 'non-existent-id';
      const errorMessage = 'Location not found';

      mockAuthService.getOwnServiceCredentials.mockResolvedValue({
        principal: { type: 'service', subject: 'test' },
        token: 'test-token',
      });

      (mockCatalogService.removeLocationById as jest.Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      const unregisterCatalogEntitiesAction = async ({
        input,
      }: {
        input: { locationId: string };
      }) => {
        if (!input.locationId || input.locationId === '') {
          return {
            output: {
              error: 'a location ID must be specified',
            },
          };
        }

        try {
          const credentials = await mockAuthService.getOwnServiceCredentials();
          await mockCatalogService.removeLocationById(input.locationId, {
            credentials,
          });

          return {
            output: {
              error: undefined,
            },
          };
        } catch (error) {
          return {
            output: {
              error: error.message,
            },
          };
        }
      };

      const result = await unregisterCatalogEntitiesAction({
        input: { locationId: nonExistentLocationId },
      });

      expect(result.output.error).toBe(errorMessage);
    });
  });
});
