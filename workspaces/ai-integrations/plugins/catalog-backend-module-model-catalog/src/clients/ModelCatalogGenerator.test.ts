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
          owner: 'example-user',
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
        tags: ['vLLM', 'granite', 'ibm'],
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
          tags: ['IBM', 'granite', 'vllm', '20b'],
          owner: 'example-user',
          lifecycle: 'production',
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
          tags: ['IBM', 'granite', 'vllm', '20b'],
          links: [
            {
              url: 'https://huggingface.co/ibm-granite/granite-20b-code-instruct',
              title: 'Artifact Location',
            },
          ],
        },
        spec: {
          owner: 'example-user',
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
          owner: 'example-user',
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
          owner: 'example-user',
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
        tags: ['vLLM', 'granite', 'ibm'],
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
        owner: 'example-user',
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
        tags: ['openapi', 'openai', '3scale'],
        links: [
          {
            url: `https://api.example.com`,
            title: `API`,
          },
        ],
      },
      spec: {
        type: 'openapi',
        owner: 'example-user',
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
});
