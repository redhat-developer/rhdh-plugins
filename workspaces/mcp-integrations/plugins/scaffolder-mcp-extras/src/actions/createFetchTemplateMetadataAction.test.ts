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

import { fetchSoftwareTemplateMetadata } from './createFetchTemplateMetadataAction';
import { CatalogService } from '@backstage/plugin-catalog-node';
import { Entity } from '@backstage/catalog-model';
import { mockServices } from '@backstage/backend-test-utils';

const mockCredentials = {
  principal: { type: 'service', subject: 'test' },
  token: 'test-token',
};

describe('createFetchTemplateMetadataAction', () => {
  describe('fetchSoftwareTemplateMetadata', () => {
    const mockCatalogService = {
      getEntities: jest.fn(),
    } as unknown as CatalogService;

    const mockLoggerService = mockServices.logger.mock();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should fetch all templates successfully', async () => {
      const mockTemplates: Entity[] = [
        {
          apiVersion: 'scaffolder.backstage.io/v1beta3',
          kind: 'Template',
          metadata: {
            name: 'react-app-template',
            tags: ['react', 'frontend', 'typescript'],
            labels: {
              category: 'web',
              language: 'typescript',
            },
            description: 'A React application template with TypeScript',
          },
          spec: {
            type: 'service',
            owner: 'team-frontend',
            parameters: [
              {
                title: 'Application Information',
                required: ['name', 'owner'],
                properties: {
                  name: { type: 'string' },
                  owner: { type: 'string' },
                },
              },
            ],
            steps: [
              {
                id: 'fetch',
                name: 'Fetch Base',
                action: 'fetch:template',
              },
            ],
          },
        },
        {
          apiVersion: 'scaffolder.backstage.io/v1beta3',
          kind: 'Template',
          metadata: {
            name: 'spring-boot-template',
            tags: ['java', 'spring-boot', 'backend'],
            description: 'A Spring Boot microservice template',
          },
          spec: {
            type: 'service',
            owner: 'team-backend',
            parameters: [
              {
                title: 'Service Configuration',
                required: ['serviceName'],
              },
            ],
            steps: [
              {
                id: 'fetch',
                name: 'Fetch Template',
                action: 'fetch:template',
              },
            ],
          },
        },
      ];

      (mockCatalogService.getEntities as jest.Mock).mockResolvedValue({
        items: mockTemplates,
      });

      const result = await fetchSoftwareTemplateMetadata(
        mockCatalogService,
        mockCredentials,
        mockLoggerService,
      );

      expect(mockCatalogService.getEntities).toHaveBeenCalledWith(
        {
          fields: [
            'metadata.name',
            'metadata.tags',
            'metadata.labels',
            'metadata.description',
            'spec.owner',
            'spec.parameters',
            'spec.steps',
          ],
          filter: { kind: 'Template' },
        },
        {
          credentials: {
            principal: { type: 'service', subject: 'test' },
            token: 'test-token',
          },
        },
      );

      expect(result).toEqual({
        templates: [
          {
            name: 'react-app-template',
            tags: 'react,frontend,typescript',
            labels: 'category:web,language:typescript',
            description: 'A React application template with TypeScript',
            owner: 'team-frontend',
            parameters: JSON.stringify([
              {
                title: 'Application Information',
                required: ['name', 'owner'],
                properties: {
                  name: { type: 'string' },
                  owner: { type: 'string' },
                },
              },
            ]),
            steps: JSON.stringify([
              {
                id: 'fetch',
                name: 'Fetch Base',
                action: 'fetch:template',
              },
            ]),
          },
          {
            name: 'spring-boot-template',
            tags: 'java,spring-boot,backend',
            labels: undefined,
            description: 'A Spring Boot microservice template',
            owner: 'team-backend',
            parameters: JSON.stringify([
              {
                title: 'Service Configuration',
                required: ['serviceName'],
              },
            ]),
            steps: JSON.stringify([
              {
                id: 'fetch',
                name: 'Fetch Template',
                action: 'fetch:template',
              },
            ]),
          },
        ],
      });
    });

    it('should filter templates by name', async () => {
      const mockTemplates: Entity[] = [
        {
          apiVersion: 'scaffolder.backstage.io/v1beta3',
          kind: 'Template',
          metadata: {
            name: 'nodejs-template',
            tags: ['nodejs', 'backend'],
            description: 'A Node.js service template',
          },
          spec: {
            owner: 'team-platform',
            parameters: [],
            steps: [],
          },
        },
      ];

      (mockCatalogService.getEntities as jest.Mock).mockResolvedValue({
        items: mockTemplates,
      });

      const result = await fetchSoftwareTemplateMetadata(
        mockCatalogService,
        mockCredentials,
        mockLoggerService,
        { name: 'nodejs-template' },
      );

      expect(mockCatalogService.getEntities).toHaveBeenCalledWith(
        {
          fields: [
            'metadata.name',
            'metadata.tags',
            'metadata.labels',
            'metadata.description',
            'spec.owner',
            'spec.parameters',
            'spec.steps',
          ],
          filter: {
            kind: 'Template',
            'metadata.name': 'nodejs-template',
          },
        },
        {
          credentials: {
            principal: { type: 'service', subject: 'test' },
            token: 'test-token',
          },
        },
      );

      expect(result.templates).toHaveLength(1);
      expect(result.templates[0].name).toBe('nodejs-template');
    });

    it('should filter templates by title', async () => {
      const mockTemplates: Entity[] = [
        {
          apiVersion: 'scaffolder.backstage.io/v1beta3',
          kind: 'Template',
          metadata: {
            name: 'python-service',
            title: 'Python Microservice Template',
            tags: ['python', 'backend'],
            description: 'A Python-based microservice template',
          },
          spec: {
            owner: 'team-backend',
          },
        },
      ];

      (mockCatalogService.getEntities as jest.Mock).mockResolvedValue({
        items: mockTemplates,
      });

      const result = await fetchSoftwareTemplateMetadata(
        mockCatalogService,
        mockCredentials,
        mockLoggerService,
        { title: 'Python Microservice Template' },
      );

      expect(mockCatalogService.getEntities).toHaveBeenCalledWith(
        {
          fields: [
            'metadata.name',
            'metadata.tags',
            'metadata.labels',
            'metadata.description',
            'spec.owner',
            'spec.parameters',
            'spec.steps',
          ],
          filter: {
            kind: 'Template',
            'metadata.title': 'Python Microservice Template',
          },
        },
        {
          credentials: {
            principal: { type: 'service', subject: 'test' },
            token: 'test-token',
          },
        },
      );

      expect(result.templates).toHaveLength(1);
      expect(result.templates[0].name).toBe('python-service');
    });

    it('should filter templates by uid', async () => {
      const mockTemplates: Entity[] = [
        {
          apiVersion: 'scaffolder.backstage.io/v1beta3',
          kind: 'Template',
          metadata: {
            name: 'go-template',
            uid: 'template:default/go-template',
            tags: ['golang', 'backend'],
            description: 'A Go service template',
          },
          spec: {
            owner: 'team-platform',
          },
        },
      ];

      (mockCatalogService.getEntities as jest.Mock).mockResolvedValue({
        items: mockTemplates,
      });

      const result = await fetchSoftwareTemplateMetadata(
        mockCatalogService,
        mockCredentials,
        mockLoggerService,
        { uid: 'template:default/go-template' },
      );

      expect(mockCatalogService.getEntities).toHaveBeenCalledWith(
        {
          fields: [
            'metadata.name',
            'metadata.tags',
            'metadata.labels',
            'metadata.description',
            'spec.owner',
            'spec.parameters',
            'spec.steps',
          ],
          filter: {
            kind: 'Template',
            'metadata.uid': 'template:default/go-template',
          },
        },
        {
          credentials: {
            principal: { type: 'service', subject: 'test' },
            token: 'test-token',
          },
        },
      );

      expect(result.templates).toHaveLength(1);
      expect(result.templates[0].name).toBe('go-template');
    });

    it('should filter templates by multiple criteria', async () => {
      const mockTemplates: Entity[] = [
        {
          apiVersion: 'scaffolder.backstage.io/v1beta3',
          kind: 'Template',
          metadata: {
            name: 'rust-template',
            title: 'Rust Service Template',
            uid: 'template:default/rust-template',
            tags: ['rust', 'backend'],
            description: 'A Rust service template',
          },
          spec: {
            owner: 'team-platform',
          },
        },
      ];

      (mockCatalogService.getEntities as jest.Mock).mockResolvedValue({
        items: mockTemplates,
      });

      const result = await fetchSoftwareTemplateMetadata(
        mockCatalogService,
        mockCredentials,
        mockLoggerService,
        {
          name: 'rust-template',
          title: 'Rust Service Template',
          uid: 'template:default/rust-template',
        },
      );

      expect(mockCatalogService.getEntities).toHaveBeenCalledWith(
        {
          fields: [
            'metadata.name',
            'metadata.tags',
            'metadata.labels',
            'metadata.description',
            'spec.owner',
            'spec.parameters',
            'spec.steps',
          ],
          filter: {
            kind: 'Template',
            'metadata.name': 'rust-template',
            'metadata.title': 'Rust Service Template',
            'metadata.uid': 'template:default/rust-template',
          },
        },
        {
          credentials: {
            principal: { type: 'service', subject: 'test' },
            token: 'test-token',
          },
        },
      );

      expect(result.templates).toHaveLength(1);
      expect(result.templates[0].name).toBe('rust-template');
    });

    it('should handle templates with no tags or labels', async () => {
      const mockTemplates: Entity[] = [
        {
          apiVersion: 'scaffolder.backstage.io/v1beta3',
          kind: 'Template',
          metadata: {
            name: 'minimal-template',
            description: 'A minimal template',
          },
          spec: {
            owner: 'team-test',
          },
        },
      ];

      (mockCatalogService.getEntities as jest.Mock).mockResolvedValue({
        items: mockTemplates,
      });

      const result = await fetchSoftwareTemplateMetadata(
        mockCatalogService,
        mockCredentials,
        mockLoggerService,
      );

      expect(result).toEqual({
        templates: [
          {
            name: 'minimal-template',
            tags: undefined,
            labels: undefined,
            description: 'A minimal template',
            owner: 'team-test',
            parameters: undefined,
            steps: undefined,
          },
        ],
      });
    });

    it('should handle templates with no description or owner', async () => {
      const mockTemplates: Entity[] = [
        {
          apiVersion: 'scaffolder.backstage.io/v1beta3',
          kind: 'Template',
          metadata: {
            name: 'bare-template',
            tags: ['test'],
          },
          spec: {
            parameters: [],
            steps: [],
          },
        },
      ];

      (mockCatalogService.getEntities as jest.Mock).mockResolvedValue({
        items: mockTemplates,
      });

      const result = await fetchSoftwareTemplateMetadata(
        mockCatalogService,
        mockCredentials,
        mockLoggerService,
      );

      expect(result).toEqual({
        templates: [
          {
            name: 'bare-template',
            tags: 'test',
            labels: undefined,
            description: undefined,
            owner: undefined,
            parameters: JSON.stringify([]),
            steps: JSON.stringify([]),
          },
        ],
      });
    });

    it('should handle empty catalog', async () => {
      (mockCatalogService.getEntities as jest.Mock).mockResolvedValue({
        items: [],
      });

      const result = await fetchSoftwareTemplateMetadata(
        mockCatalogService,
        mockCredentials,
        mockLoggerService,
      );

      expect(result).toEqual({
        templates: [],
      });
    });

    it('should handle catalog service errors', async () => {
      (mockCatalogService.getEntities as jest.Mock).mockRejectedValue(
        new Error('Catalog service error'),
      );

      await expect(
        fetchSoftwareTemplateMetadata(
          mockCatalogService,
          mockCredentials,
          mockLoggerService,
        ),
      ).rejects.toThrow('Catalog service error');
    });

    it('should handle templates with complex parameters and steps', async () => {
      const complexParameters = [
        {
          title: 'Application Information',
          required: ['name', 'owner', 'description'],
          properties: {
            name: {
              type: 'string',
              title: 'Name',
              description: 'Unique name of the application',
            },
            owner: {
              type: 'string',
              title: 'Owner',
              description: 'Owner team or user',
            },
            description: {
              type: 'string',
              title: 'Description',
              description: 'Brief description of the application',
            },
          },
        },
        {
          title: 'Advanced Settings',
          properties: {
            enableMetrics: {
              type: 'boolean',
              title: 'Enable Metrics',
              default: true,
            },
          },
        },
      ];

      const complexSteps = [
        {
          id: 'fetch-base',
          name: 'Fetch Base Template',
          action: 'fetch:template',
          input: {
            url: './skeleton',
            values: {
              name: '${{ parameters.name }}',
              owner: '${{ parameters.owner }}',
            },
          },
        },
        {
          id: 'publish',
          name: 'Publish to GitHub',
          action: 'publish:github',
          input: {
            repoUrl: '${{ parameters.repoUrl }}',
          },
        },
      ];

      const mockTemplates: Entity[] = [
        {
          apiVersion: 'scaffolder.backstage.io/v1beta3',
          kind: 'Template',
          metadata: {
            name: 'complex-template',
            tags: ['advanced', 'full-featured'],
            description: 'A complex template with many parameters',
          },
          spec: {
            owner: 'team-architecture',
            parameters: complexParameters,
            steps: complexSteps,
          },
        },
      ];

      (mockCatalogService.getEntities as jest.Mock).mockResolvedValue({
        items: mockTemplates,
      });

      const result = await fetchSoftwareTemplateMetadata(
        mockCatalogService,
        mockCredentials,
        mockLoggerService,
      );

      expect(result.templates).toHaveLength(1);
      expect(result.templates[0].name).toBe('complex-template');
      expect(result.templates[0].parameters).toBe(
        JSON.stringify(complexParameters),
      );
      expect(result.templates[0].steps).toBe(JSON.stringify(complexSteps));
    });
  });

  describe('fetch-template-metadata action', () => {
    const mockCatalogService = {
      getEntities: jest.fn(),
    } as unknown as CatalogService;

    const mockLoggerService = mockServices.logger.mock();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully fetch templates through action', async () => {
      const mockTemplates: Entity[] = [
        {
          apiVersion: 'scaffolder.backstage.io/v1beta3',
          kind: 'Template',
          metadata: {
            name: 'test-template',
            tags: ['test'],
            description: 'A test template',
          },
          spec: {
            owner: 'test-team',
            parameters: [],
            steps: [],
          },
        },
      ];

      (mockCatalogService.getEntities as jest.Mock).mockResolvedValue({
        items: mockTemplates,
      });

      // Simulate the action logic
      const fetchTemplateMetadataAction = async ({
        input,
      }: {
        input: {
          name?: string;
          title?: string;
          uid?: string;
        };
      }) => {
        try {
          const result = await fetchSoftwareTemplateMetadata(
            mockCatalogService,
            mockCredentials,
            mockLoggerService,
            input,
          );
          return {
            output: {
              ...result,
              error: undefined,
            },
          };
        } catch (error) {
          return {
            output: {
              templates: [],
              error: error.message,
            },
          };
        }
      };

      const result = await fetchTemplateMetadataAction({
        input: {},
      });

      expect(result.output).toHaveProperty('templates');
      expect(result.output).toHaveProperty('error');
      expect(Array.isArray(result.output.templates)).toBe(true);
      expect(result.output.templates).toHaveLength(1);
      expect(result.output.templates[0]).toEqual({
        name: 'test-template',
        tags: 'test',
        labels: undefined,
        description: 'A test template',
        owner: 'test-team',
        parameters: JSON.stringify([]),
        steps: JSON.stringify([]),
      });
      expect(result.output.error).toBeUndefined();
    });

    it('should handle errors in action', async () => {
      (mockCatalogService.getEntities as jest.Mock).mockRejectedValue(
        new Error('Failed to fetch templates'),
      );

      // Simulate the action logic
      const fetchTemplateMetadataAction = async ({
        input,
      }: {
        input: {
          name?: string;
          title?: string;
          uid?: string;
        };
      }) => {
        try {
          const result = await fetchSoftwareTemplateMetadata(
            mockCatalogService,
            mockCredentials,
            mockLoggerService,
            input,
          );
          return {
            output: {
              ...result,
              error: undefined,
            },
          };
        } catch (error) {
          return {
            output: {
              templates: [],
              error: error.message,
            },
          };
        }
      };

      const result = await fetchTemplateMetadataAction({
        input: {},
      });

      expect(result.output.error).toBe('Failed to fetch templates');
      expect(result.output.templates).toEqual([]);
    });

    it('should successfully filter templates by name through action', async () => {
      const mockTemplates: Entity[] = [
        {
          apiVersion: 'scaffolder.backstage.io/v1beta3',
          kind: 'Template',
          metadata: {
            name: 'specific-template',
            tags: ['specific'],
            description: 'A specific template',
          },
          spec: {
            owner: 'test-team',
          },
        },
      ];

      (mockCatalogService.getEntities as jest.Mock).mockResolvedValue({
        items: mockTemplates,
      });

      // Simulate the action logic
      const fetchTemplateMetadataAction = async ({
        input,
      }: {
        input: {
          name?: string;
          title?: string;
          uid?: string;
        };
      }) => {
        try {
          const result = await fetchSoftwareTemplateMetadata(
            mockCatalogService,
            mockCredentials,
            mockLoggerService,
            input,
          );
          return {
            output: {
              ...result,
              error: undefined,
            },
          };
        } catch (error) {
          return {
            output: {
              templates: [],
              error: error.message,
            },
          };
        }
      };

      const result = await fetchTemplateMetadataAction({
        input: { name: 'specific-template' },
      });

      expect(mockCatalogService.getEntities).toHaveBeenCalledWith(
        {
          fields: [
            'metadata.name',
            'metadata.tags',
            'metadata.labels',
            'metadata.description',
            'spec.owner',
            'spec.parameters',
            'spec.steps',
          ],
          filter: {
            kind: 'Template',
            'metadata.name': 'specific-template',
          },
        },
        {
          credentials: {
            principal: { type: 'service', subject: 'test' },
            token: 'test-token',
          },
        },
      );

      expect(result.output.templates).toHaveLength(1);
      expect(result.output.templates[0].name).toBe('specific-template');
      expect(result.output.error).toBeUndefined();
    });
  });
});
