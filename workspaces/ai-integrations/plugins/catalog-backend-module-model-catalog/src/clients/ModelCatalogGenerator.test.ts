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
  GenerateCatalogEntities,
  ParseCatalogJSON,
} from './ModelCatalogGenerator';
import { Entity } from '@backstage/catalog-model';
import { ModelCatalog } from '@redhat-ai-dev/model-catalog-types';

// ts-jest throws a module import error when pulling in enums defined in *.d.ts files
// https://github.com/kulshekhar/ts-jest/issues/1229 - but our generator throws the enum in there, so we don't have the option to move it
// Mocking the Type enum should be sufficient for these test cases
enum Type {
  Asyncapi = 'asyncapi',
  Graphql = 'graphql',
  Grpc = 'grpc',
  Openapi = 'openapi',
}

describe('Model Catalog Generator', () => {
  it('should return empty array when no modelServer is present', () => {
    const modelCatalog: ModelCatalog = {
      models: [
        {
          name: 'ibm-granite',
          description: 'IBM Granite code model',
          lifecycle: 'production',
          owner: 'example-user',
        },
      ],
    };
    const entities = GenerateCatalogEntities(modelCatalog);
    expect(entities).toEqual([]);
  });

  it('should generate a single AiModelServerAPI entity from a model server with models', () => {
    const modelCatalog: ModelCatalog = {
      modelServer: {
        name: 'developer-model-service',
        owner: 'example-user',
        description: 'Developer model service running on vLLM',
        homepageURL: 'https://example.com',
        tags: ['vllm', 'granite', 'ibm'],
        API: {
          url: 'https://api.example.com',
          type: Type.Openapi,
          spec: 'https://raw.githubusercontent.com/redhat-ai-dev/model-catalog-example/refs/heads/main/developer-model-service/openapi.json',
          tags: ['openapi', 'openai', '3scale'],
        },
        lifecycle: 'production',
        authentication: true,
      },
      models: [
        {
          name: 'ibm-granite-20b',
          description: 'IBM Granite 20b model running on vLLM',
          artifactLocationURL:
            'https://huggingface.co/ibm-granite/granite-20b-code-instruct',
          tags: ['ibm', 'granite', 'vllm', '20b'],
          owner: 'example-user',
          lifecycle: 'production',
          license: 'https://www.apache.org/licenses/LICENSE-2.0',
        },
        {
          name: 'mistral-7b',
          description: 'Mistral 7b model running on vLLM',
          artifactLocationURL:
            'https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.2',
          tags: ['mistralai', 'mistral', 'vllm', '7b'],
          owner: 'example-user',
          lifecycle: 'production',
        },
      ],
    };

    const entities = GenerateCatalogEntities(modelCatalog);
    expect(entities.length).toBe(1);

    const expected: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'AiModelServerAPI',
      metadata: {
        name: 'developer-model-service',
        description: 'Developer model service running on vLLM',
        tags: ['vllm', 'granite', 'ibm', 'auth-required'],
        links: [
          { title: 'API', url: 'https://api.example.com' },
          { title: 'Homepage', url: 'https://example.com' },
          {
            title: 'ibm-granite-20b artifact',
            url: 'https://huggingface.co/ibm-granite/granite-20b-code-instruct',
          },
          {
            title: 'mistral-7b artifact',
            url: 'https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.2',
          },
        ],
      },
      spec: {
        type: 'ai-model-server',
        lifecycle: 'production',
        owner: 'user:example-user',
        serverType: 'openapi',
        serverUrl: 'https://api.example.com',
        requiresApiKey: true,
        models: {
          available: ['ibm-granite-20b', 'mistral-7b'],
          default: 'ibm-granite-20b',
        },
      },
    };
    expect(entities[0]).toEqual(expected);
  });

  it('should generate entity with auth-not-required tag when authentication is false', () => {
    const modelCatalog: ModelCatalog = {
      modelServer: {
        name: 'open-model-service',
        owner: 'example-user',
        description: 'Model service without auth',
        API: {
          url: 'https://api.example.com',
          type: Type.Openapi,
          spec: 'https://example.com/openapi.json',
        },
        lifecycle: 'production',
      },
      models: [
        {
          name: 'test-model',
          description: 'Test model',
          lifecycle: 'production',
          owner: 'example-user',
        },
      ],
    };

    const entities = GenerateCatalogEntities(modelCatalog);
    expect(entities.length).toBe(1);
    expect(entities[0].metadata.tags).toContain('auth-not-required');
    expect(entities[0].spec).toMatchObject({
      requiresApiKey: false,
    });
  });

  it('should copy API and modelServer annotations to entity metadata', () => {
    const modelCatalog: ModelCatalog = {
      modelServer: {
        name: 'annotated-service',
        owner: 'example-user',
        description: 'Model service with annotations',
        lifecycle: 'production',
        annotations: {
          'server.io/annotation1': 'from-server',
        },
        API: {
          url: 'https://api.example.com',
          type: Type.Openapi,
          spec: 'https://example.com/openapi.json',
          annotations: {
            'api.io/annotation1': 'from-api',
          },
        },
      },
      models: [
        {
          name: 'test-model',
          description: 'Test model',
          lifecycle: 'production',
          owner: 'example-user',
        },
      ],
    };

    const entities = GenerateCatalogEntities(modelCatalog);
    expect(entities[0].metadata.annotations).toEqual({
      'api.io/annotation1': 'from-api',
      'server.io/annotation1': 'from-server',
    });
  });

  it('should set techdocs annotation from model annotations', () => {
    const modelCatalog: ModelCatalog = {
      modelServer: {
        name: 'techdocs-service',
        owner: 'example-user',
        description: 'Service with techdocs',
        lifecycle: 'production',
        API: {
          url: 'https://api.example.com',
          type: Type.Openapi,
          spec: 'https://example.com/openapi.json',
        },
      },
      models: [
        {
          name: 'model-with-docs',
          description: 'Model with techdocs',
          lifecycle: 'production',
          owner: 'example-user',
          annotations: {
            techdocs:
              'https://github.com/redhat-ai-dev/granite-3.1-8b-lab-docs/tree/main',
          },
        },
      ],
    };

    const entities = GenerateCatalogEntities(modelCatalog);
    expect(entities[0].metadata.annotations).toEqual({
      'backstage.io/techdocs-ref':
        'url:https://github.com/redhat-ai-dev/granite-3.1-8b-lab-docs/tree/main',
    });
  });

  it('should prepend svcUrl to relative techdocs paths', () => {
    const modelCatalog: ModelCatalog = {
      modelServer: {
        name: 'techdocs-relative-service',
        owner: 'example-user',
        description: 'Service with relative techdocs path',
        lifecycle: 'production',
        API: {
          url: 'https://api.example.com',
          type: Type.Openapi,
          spec: 'https://example.com/openapi.json',
        },
      },
      models: [
        {
          name: 'model-with-relative-docs',
          description: 'Model with relative techdocs path',
          lifecycle: 'production',
          owner: 'example-user',
          annotations: {
            techdocs: '/modelcard/source1/modelA',
          },
        },
      ],
    };

    const entities = GenerateCatalogEntities(
      modelCatalog,
      'http://localhost:7007/api/kserve-kubeflow-connector',
    );
    expect(entities[0].metadata.annotations).toEqual({
      'backstage.io/techdocs-ref':
        'url:http://localhost:7007/api/kserve-kubeflow-connector/modelcard/source1/modelA',
    });
  });

  it('should handle techdocs with surrounding whitespace', () => {
    const modelCatalog: ModelCatalog = {
      modelServer: {
        name: 'whitespace-service',
        owner: 'example-user',
        description: 'Service with whitespace techdocs',
        lifecycle: 'production',
        API: {
          url: 'https://api.example.com',
          type: Type.Openapi,
          spec: 'https://example.com/openapi.json',
        },
      },
      models: [
        {
          name: 'model-whitespace',
          description: 'Model with whitespace',
          lifecycle: 'production',
          owner: 'example-user',
          annotations: {
            techdocs:
              '      https://github.com/redhat-ai-dev/docs/tree/main           ',
          },
        },
      ],
    };

    const entities = GenerateCatalogEntities(modelCatalog);
    expect(entities[0].metadata.annotations).toEqual({
      'backstage.io/techdocs-ref':
        'url:https://github.com/redhat-ai-dev/docs/tree/main',
    });
  });

  it('should return empty array when modelServer has no API url', () => {
    const modelCatalog: ModelCatalog = {
      modelServer: {
        name: 'no-api-service',
        owner: 'example-user',
        description: 'Model server without API',
        lifecycle: 'production',
      },
      models: [
        {
          name: 'test-model',
          description: 'Test model',
          lifecycle: 'production',
          owner: 'example-user',
        },
      ],
    };
    const entities = GenerateCatalogEntities(modelCatalog);
    expect(entities).toEqual([]);
  });

  it('should handle empty models array', () => {
    const modelCatalog: ModelCatalog = {
      modelServer: {
        name: 'empty-models-service',
        owner: 'example-user',
        description: 'Model server with no models',
        lifecycle: 'production',
        API: {
          url: 'https://api.example.com',
          type: Type.Openapi,
          spec: 'https://example.com/openapi.json',
        },
      },
      models: [],
    };

    const entities = GenerateCatalogEntities(modelCatalog);
    expect(entities.length).toBe(1);
    expect(entities[0].spec).toMatchObject({
      models: {
        available: [],
      },
    });
    expect((entities[0].spec as any).models.default).toBeUndefined();
  });

  it('should not include annotations when none are present', () => {
    const modelCatalog: ModelCatalog = {
      modelServer: {
        name: 'no-annotations-service',
        owner: 'example-user',
        description: 'Service without annotations',
        lifecycle: 'production',
        API: {
          url: 'https://api.example.com',
          type: Type.Openapi,
          spec: 'https://example.com/openapi.json',
        },
      },
      models: [
        {
          name: 'plain-model',
          description: 'Model without annotations',
          lifecycle: 'production',
          owner: 'example-user',
        },
      ],
    };

    const entities = GenerateCatalogEntities(modelCatalog);
    expect(entities[0].metadata.annotations).toBeUndefined();
  });
});

describe('ParseCatalogJSON', () => {
  it('should parse valid JSON with models field', () => {
    const json = JSON.stringify({
      models: [
        {
          name: 'test-model',
          description: 'A test model',
          lifecycle: 'production',
          owner: 'owner',
        },
      ],
    });
    const result = ParseCatalogJSON(json);
    expect(result.models).toHaveLength(1);
    expect(result.models[0].name).toBe('test-model');
  });

  it('should parse valid JSON with modelServer field', () => {
    const json = JSON.stringify({
      models: [],
      modelServer: {
        name: 'test-server',
        owner: 'owner',
        description: 'A test server',
        lifecycle: 'production',
      },
    });
    const result = ParseCatalogJSON(json);
    expect(result.modelServer).toBeDefined();
    expect(result.modelServer?.name).toBe('test-server');
  });

  it('should throw on invalid JSON', () => {
    expect(() => ParseCatalogJSON('not-json')).toThrow();
  });

  it('should throw when JSON has no models or modelServer', () => {
    const json = JSON.stringify({ unrelated: 'data' });
    expect(() => ParseCatalogJSON(json)).toThrow(
      'model catalog JSON in unexpected format',
    );
  });
});
