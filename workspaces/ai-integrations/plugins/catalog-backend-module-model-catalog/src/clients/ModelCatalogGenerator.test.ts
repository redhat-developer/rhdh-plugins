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
import { GenerateCatalogEntities } from './ModelCatalogGenerator';
import { Entity, ComponentEntity, ApiEntity } from '@backstage/catalog-model';
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
  it('should generate catalog entities from a single model with defaults', () => {
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
    const modelCatalogEntities = GenerateCatalogEntities(modelCatalog);
    expect(modelCatalogEntities.length).toEqual(1);

    const expectedModelEntities: Entity[] = [
      {
        apiVersion: 'backstage.io/v1beta1',
        kind: 'Resource',
        metadata: {
          name: 'ibm-granite',
          description: 'IBM Granite code model',
          tags: [],
          links: [],
        },
        spec: {
          dependencyOf: [],
          owner: 'user:example-user',
          type: 'ai-model',
        },
      },
    ];
    expect(modelCatalogEntities).toEqual(expectedModelEntities);
  });
  it('should generate techdoc annotations when present on the json object', () => {
    const modelCatalog: ModelCatalog = {
      models: [
        {
          name: 'ibm-granite',
          description: 'IBM Granite code model',
          lifecycle: 'production',
          owner: 'example-user',
          annotations: {
            TechDocs:
              'https://github.com/redhat-ai-dev/granite-3.1-8b-lab-docs/tree/main',
          },
        },
      ],
    };
    const modelCatalogEntities = GenerateCatalogEntities(modelCatalog);
    expect(modelCatalogEntities.length).toEqual(1);

    const expectedModelEntities: Entity[] = [
      {
        apiVersion: 'backstage.io/v1beta1',
        kind: 'Resource',
        metadata: {
          name: 'ibm-granite',
          description: 'IBM Granite code model',
          annotations: {
            'backstage.io/techdocs-ref': `url:https://github.com/redhat-ai-dev/granite-3.1-8b-lab-docs/tree/main`,
          },
          tags: [],
          links: [],
        },
        spec: {
          dependencyOf: [],
          owner: 'user:example-user',
          type: 'ai-model',
        },
      },
    ];
    expect(modelCatalogEntities).toEqual(expectedModelEntities);
  });
  it('should generate techdoc annotations when present on the json object even if unnecessary whitespace is present', () => {
    const modelCatalog: ModelCatalog = {
      models: [
        {
          name: 'ibm-granite',
          description: 'IBM Granite code model',
          lifecycle: 'production',
          owner: 'example-user',
          annotations: {
            TechDocs:
              '      https://github.com/redhat-ai-dev/granite-3.1-8b-lab-docs/tree/main           ',
          },
        },
      ],
    };
    const modelCatalogEntities = GenerateCatalogEntities(modelCatalog);
    expect(modelCatalogEntities.length).toEqual(1);

    const expectedModelEntities: Entity[] = [
      {
        apiVersion: 'backstage.io/v1beta1',
        kind: 'Resource',
        metadata: {
          name: 'ibm-granite',
          description: 'IBM Granite code model',
          annotations: {
            'backstage.io/techdocs-ref': `url:https://github.com/redhat-ai-dev/granite-3.1-8b-lab-docs/tree/main`,
          },
          tags: [],
          links: [],
        },
        spec: {
          dependencyOf: [],
          owner: 'user:example-user',
          type: 'ai-model',
        },
      },
    ];
    expect(modelCatalogEntities).toEqual(expectedModelEntities);
  });
  it('should generate catalog entities for multiple models and a model server with API', () => {
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
        {
          name: 'gemma-2-2b',
          description: 'Google Gemma 2 2b model running on vLLM',
          artifactLocationURL: 'https://huggingface.co/google/gemma-2-2b',
          howToUseURL: 'https://example.com/gemma',
          tags: ['google', 'gemma'],
          owner: 'example-user',
          lifecycle: 'production',
        },
      ],
    };
    const modelCatalogEntities = GenerateCatalogEntities(modelCatalog);
    expect(modelCatalog.modelServer !== undefined).toBe(true);
    expect(modelCatalog.models.length).toBe(3);

    const expectedModelEntities: Entity[] = [
      {
        apiVersion: 'backstage.io/v1beta1',
        kind: 'Resource',
        metadata: {
          name: 'ibm-granite-20b',
          description: 'IBM Granite 20b model running on vLLM',
          tags: ['ibm', 'granite', 'vllm', '20b'],
          links: [
            {
              url: 'https://huggingface.co/ibm-granite/granite-20b-code-instruct',
              title: 'Artifact Location',
            },
            {
              url: 'https://www.apache.org/licenses/LICENSE-2.0',
              title: 'License',
            },
          ],
        },
        spec: {
          owner: 'user:example-user',
          type: 'ai-model',
          dependencyOf: ['component:developer-model-service'],
        },
      },
      {
        apiVersion: 'backstage.io/v1beta1',
        kind: 'Resource',
        metadata: {
          name: 'mistral-7b',
          description: 'Mistral 7b model running on vLLM',
          tags: ['mistralai', 'mistral', 'vllm', '7b'],
          links: [
            {
              url: 'https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.2',
              title: 'Artifact Location',
            },
          ],
        },
        spec: {
          owner: 'user:example-user',
          type: 'ai-model',
          dependencyOf: ['component:developer-model-service'],
        },
      },
      {
        apiVersion: 'backstage.io/v1beta1',
        kind: 'Resource',
        metadata: {
          name: 'gemma-2-2b',
          description: 'Google Gemma 2 2b model running on vLLM',
          tags: ['google', 'gemma'],
          links: [
            {
              url: 'https://huggingface.co/google/gemma-2-2b',
              title: 'Artifact Location',
            },
            {
              url: 'https://example.com/gemma',
              title: 'How to use',
            },
          ],
        },
        spec: {
          owner: 'user:example-user',
          type: 'ai-model',
          dependencyOf: ['component:developer-model-service'],
        },
      },
    ];
    const expectedModelServerEntity: ComponentEntity = {
      apiVersion: 'backstage.io/v1beta1',
      kind: 'Component',
      metadata: {
        name: 'developer-model-service',
        description: 'Developer model service running on vLLM',
        tags: ['vllm', 'granite', 'ibm', 'auth-required'],
        links: [
          {
            url: 'https://api.example.com',
            title: 'API',
          },
          {
            url: 'https://example.com',
            title: 'Homepage',
          },
        ],
      },
      spec: {
        type: 'model-server',
        lifecycle: 'production',
        owner: 'user:example-user',
        dependsOn: [
          'resource:ibm-granite-20b',
          'resource:mistral-7b',
          'resource:gemma-2-2b',
        ],
        providesApis: ['developer-model-service'],
      },
    };

    const expectedModelServerAPIEntity: ApiEntity = {
      apiVersion: `backstage.io/v1beta1`,
      kind: `API`,
      metadata: {
        name: 'developer-model-service',
        tags: ['openapi', 'openai', '3scale', 'auth-required'],
        links: [
          {
            url: `https://api.example.com`,
            title: `API`,
          },
        ],
      },
      spec: {
        type: 'openapi',
        owner: 'user:example-user',
        lifecycle: 'production',
        definition:
          'https://raw.githubusercontent.com/redhat-ai-dev/model-catalog-example/refs/heads/main/developer-model-service/openapi.json',
      },
    };
    const expectedEntities: Entity[] = expectedModelEntities;
    expectedEntities.push(expectedModelServerEntity);
    expectedEntities.push(expectedModelServerAPIEntity);
    expect(modelCatalogEntities).toEqual(expectedModelEntities);
  });
  it('should generate catalog entities for a model server that doesn not require authentication', () => {
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
      ],
    };
    const modelCatalogEntities = GenerateCatalogEntities(modelCatalog);
    expect(modelCatalog.modelServer !== undefined).toBe(true);
    expect(modelCatalog.models.length).toBe(1);

    const expectedModelEntities: Entity[] = [
      {
        apiVersion: 'backstage.io/v1beta1',
        kind: 'Resource',
        metadata: {
          name: 'ibm-granite-20b',
          description: 'IBM Granite 20b model running on vLLM',
          tags: ['ibm', 'granite', 'vllm', '20b'],
          links: [
            {
              url: 'https://huggingface.co/ibm-granite/granite-20b-code-instruct',
              title: 'Artifact Location',
            },
            {
              url: 'https://www.apache.org/licenses/LICENSE-2.0',
              title: 'License',
            },
          ],
        },
        spec: {
          owner: 'user:example-user',
          type: 'ai-model',
          dependencyOf: ['component:developer-model-service'],
        },
      },
    ];
    const expectedModelServerEntity: ComponentEntity = {
      apiVersion: 'backstage.io/v1beta1',
      kind: 'Component',
      metadata: {
        name: 'developer-model-service',
        description: 'Developer model service running on vLLM',
        tags: ['vllm', 'granite', 'ibm', 'auth-not-required'],
        links: [
          {
            url: 'https://api.example.com',
            title: 'API',
          },
          {
            url: 'https://example.com',
            title: 'Homepage',
          },
        ],
      },
      spec: {
        type: 'model-server',
        lifecycle: 'production',
        owner: 'user:example-user',
        dependsOn: ['resource:ibm-granite-20b'],
        providesApis: ['developer-model-service'],
      },
    };

    const expectedModelServerAPIEntity: ApiEntity = {
      apiVersion: `backstage.io/v1beta1`,
      kind: `API`,
      metadata: {
        name: 'developer-model-service',
        tags: ['openapi', 'openai', '3scale', 'auth-not-required'],
        links: [
          {
            url: `https://api.example.com`,
            title: `API`,
          },
        ],
      },
      spec: {
        type: 'openapi',
        owner: 'user:example-user',
        lifecycle: 'production',
        definition:
          'https://raw.githubusercontent.com/redhat-ai-dev/model-catalog-example/refs/heads/main/developer-model-service/openapi.json',
      },
    };
    const expectedEntities: Entity[] = expectedModelEntities;
    expectedEntities.push(expectedModelServerEntity);
    expectedEntities.push(expectedModelServerAPIEntity);
    expect(modelCatalogEntities).toEqual(expectedModelEntities);
  });

  it('should copy API annotations to model server component metadata when present', () => {
    const modelCatalog: ModelCatalog = {
      modelServer: {
        name: 'annotated-model-service',
        owner: 'example-user',
        description: 'Model service with API annotations',
        API: {
          url: 'https://api.example.com',
          type: Type.Openapi,
          spec: 'https://example.com/openapi.json',
          annotations: {
            'custom.io/annotation1': 'value1',
            'custom.io/annotation2': 'value2',
            'backstage.io/custom-tag': 'custom-value',
          },
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

    const modelCatalogEntities = GenerateCatalogEntities(modelCatalog);

    // Find the model server component entity
    const modelServerComponent = modelCatalogEntities.find(
      entity =>
        entity.kind === 'Component' &&
        entity.metadata.name === 'annotated-model-service',
    ) as ComponentEntity;

    expect(modelServerComponent).toBeDefined();
    expect(modelServerComponent.metadata.annotations).toBeDefined();
    expect(modelServerComponent.metadata.annotations).toEqual({
      'custom.io/annotation1': 'value1',
      'custom.io/annotation2': 'value2',
      'backstage.io/custom-tag': 'custom-value',
    });
  });

  it('should handle model server with API but no annotations gracefully', () => {
    const modelCatalog: ModelCatalog = {
      modelServer: {
        name: 'no-annotations-service',
        owner: 'example-user',
        description: 'Model service without API annotations',
        API: {
          url: 'https://api.example.com',
          type: Type.Openapi,
          spec: 'https://example.com/openapi.json',
          // No annotations property
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

    const modelCatalogEntities = GenerateCatalogEntities(modelCatalog);

    // Find the model server component entity
    const modelServerComponent = modelCatalogEntities.find(
      entity =>
        entity.kind === 'Component' &&
        entity.metadata.name === 'no-annotations-service',
    ) as ComponentEntity;

    expect(modelServerComponent).toBeDefined();
    // Should not have annotations if none were provided in API
    expect(modelServerComponent.metadata.annotations).toBeUndefined();
  });

  it('should copy modelServer annotations to component metadata when present', () => {
    const modelCatalog: ModelCatalog = {
      modelServer: {
        name: 'annotated-server',
        owner: 'example-user',
        description: 'Model server with annotations',
        lifecycle: 'production',
        annotations: {
          'custom.io/annotation1': 'server-value1',
          'custom.io/annotation2': 'server-value2',
          'backstage.io/custom-tag': 'server-custom',
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

    const modelCatalogEntities = GenerateCatalogEntities(modelCatalog);

    const modelServerComponent = modelCatalogEntities.find(
      entity =>
        entity.kind === 'Component' &&
        entity.metadata.name === 'annotated-server',
    ) as ComponentEntity;

    expect(modelServerComponent).toBeDefined();
    expect(modelServerComponent.metadata.annotations).toBeDefined();
    expect(modelServerComponent.metadata.annotations).toEqual({
      'custom.io/annotation1': 'server-value1',
      'custom.io/annotation2': 'server-value2',
      'backstage.io/custom-tag': 'server-custom',
    });
  });

  it('should merge modelServer annotations with API annotations when both are present', () => {
    const modelCatalog: ModelCatalog = {
      modelServer: {
        name: 'fully-annotated-service',
        owner: 'example-user',
        description: 'Model service with both server and API annotations',
        lifecycle: 'production',
        annotations: {
          'server.io/annotation1': 'from-server',
          'server.io/annotation2': 'also-from-server',
        },
        API: {
          url: 'https://api.example.com',
          type: Type.Openapi,
          spec: 'https://example.com/openapi.json',
          annotations: {
            'api.io/annotation1': 'from-api',
            'api.io/annotation2': 'also-from-api',
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

    const modelCatalogEntities = GenerateCatalogEntities(modelCatalog);

    // Find the model server component entity
    const modelServerComponent = modelCatalogEntities.find(
      entity =>
        entity.kind === 'Component' &&
        entity.metadata.name === 'fully-annotated-service',
    ) as ComponentEntity;

    expect(modelServerComponent).toBeDefined();
    expect(modelServerComponent.metadata.annotations).toBeDefined();
    // Should contain annotations from both API and modelServer
    expect(modelServerComponent.metadata.annotations).toEqual({
      'api.io/annotation1': 'from-api',
      'api.io/annotation2': 'also-from-api',
      'server.io/annotation1': 'from-server',
      'server.io/annotation2': 'also-from-server',
    });
  });

  it('should copy model annotations to resource metadata when present', () => {
    const modelCatalog: ModelCatalog = {
      models: [
        {
          name: 'annotated-model',
          description: 'Model with annotations',
          lifecycle: 'production',
          owner: 'example-user',
          annotations: {
            'custom.io/model-annotation1': 'model-value1',
            'custom.io/model-annotation2': 'model-value2',
            'backstage.io/custom-model-tag': 'model-custom',
          },
        },
      ],
    };

    const modelCatalogEntities = GenerateCatalogEntities(modelCatalog);

    // Find the model resource entity
    const modelResource = modelCatalogEntities.find(
      entity =>
        entity.kind === 'Resource' &&
        entity.metadata.name === 'annotated-model',
    );

    expect(modelResource).toBeDefined();
    expect(modelResource!.metadata.annotations).toBeDefined();
    expect(modelResource!.metadata.annotations).toEqual({
      'custom.io/model-annotation1': 'model-value1',
      'custom.io/model-annotation2': 'model-value2',
      'backstage.io/custom-model-tag': 'model-custom',
    });
  });

  it('should copy model annotations and preserve TechDocs special case handling', () => {
    const modelCatalog: ModelCatalog = {
      models: [
        {
          name: 'fully-annotated-model',
          description: 'Model with multiple annotations including TechDocs',
          lifecycle: 'production',
          owner: 'example-user',
          annotations: {
            TechDocs:
              'https://github.com/redhat-ai-dev/granite-3.1-8b-lab-docs/tree/main',
            'custom.io/model-annotation1': 'model-value1',
            'custom.io/model-annotation2': 'model-value2',
          },
        },
      ],
    };

    const modelCatalogEntities = GenerateCatalogEntities(modelCatalog);

    // Find the model resource entity
    const modelResource = modelCatalogEntities.find(
      entity =>
        entity.kind === 'Resource' &&
        entity.metadata.name === 'fully-annotated-model',
    );

    expect(modelResource).toBeDefined();
    expect(modelResource!.metadata.annotations).toBeDefined();
    // Should have TechDocs converted to backstage.io/techdocs-ref and other annotations copied
    expect(modelResource!.metadata.annotations).toEqual({
      'backstage.io/techdocs-ref':
        'url:https://github.com/redhat-ai-dev/granite-3.1-8b-lab-docs/tree/main',
      'custom.io/model-annotation1': 'model-value1',
      'custom.io/model-annotation2': 'model-value2',
    });
  });
});
