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

import { mockServices } from '@backstage/backend-test-utils';
import {
  callBackstagePrinters,
  SYSTEM_ANNOTATION,
  SERVER_TYPE_ANNOTATION,
  MODEL_PREFIX_ANNOTATION,
  DEFAULT_ANNOTATION,
  OWNER_ANNOTATION,
  LIFECYCLE_ANNOTATION,
} from './KServe';
import type { InferenceService } from './types';
import { CATALOG_SOURCE_ANNOTATION, CATALOG_MODEL_ANNOTATION } from './Catalog';

function makeInferenceService(
  overrides: Partial<{
    name: string;
    namespace: string;
    labels: Record<string, string>;
    annotations: Record<string, string>;
    spec: any;
    status: any;
  }> = {},
): InferenceService {
  return {
    apiVersion: 'serving.kserve.io/v1beta1',
    kind: 'InferenceService',
    metadata: {
      name: overrides.name ?? 'test-model',
      namespace: overrides.namespace ?? 'vllm',
      ...(overrides.labels && { labels: overrides.labels }),
      ...(overrides.annotations && { annotations: overrides.annotations }),
    },
    spec: overrides.spec ?? { predictor: {} },
    ...(overrides.status && { status: overrides.status }),
  };
}

describe('callBackstagePrinters', () => {
  const logger = mockServices.logger.mock();

  it('should generate basic model catalog with name, owner, lifecycle, description', async () => {
    const is = makeInferenceService({
      name: 'granite-8b',
      namespace: 'vllm',
    });

    const result = await callBackstagePrinters(
      'my-owner',
      'production',
      is,
      false,
      logger,
    );

    expect(result.models).toHaveLength(1);
    expect(result.models[0].name).toBe('vllm-granite-8b');
    expect(result.models[0].owner).toBe('my-owner');
    expect(result.models[0].lifecycle).toBe('production');
    expect(result.models[0].description).toBe(
      'KServe instance vllm:granite-8b',
    );
    expect(result.modelServer).toBeDefined();
    expect(result.modelServer!.name).toBe('vllm-granite-8b');
  });

  it('should generate predictor framework tags', async () => {
    const is = makeInferenceService({
      spec: {
        predictor: {
          sklearn: {},
          pytorch: {},
        },
      },
    });

    const result = await callBackstagePrinters(
      'owner',
      'production',
      is,
      false,
      logger,
    );

    expect(result.models[0].tags).toContain('sklearn');
    expect(result.models[0].tags).toContain('pytorch');
  });

  it('should generate model format tags from predictor.model.modelFormat', async () => {
    const is = makeInferenceService({
      spec: {
        predictor: {
          model: {
            modelFormat: { name: 'vLLM', version: '2' },
          },
        },
      },
    });

    const result = await callBackstagePrinters(
      'owner',
      'production',
      is,
      false,
      logger,
    );

    expect(result.models[0].tags).toContain('vllm-2');
  });

  it('should generate model format tag without version', async () => {
    const is = makeInferenceService({
      spec: {
        predictor: {
          model: {
            modelFormat: { name: 'ONNX' },
          },
        },
      },
    });

    const result = await callBackstagePrinters(
      'owner',
      'production',
      is,
      false,
      logger,
    );

    expect(result.models[0].tags).toContain('onnx');
  });

  it('should convert labels to tags on modelServer', async () => {
    const is = makeInferenceService({
      labels: {
        'app.kubernetes.io/name': 'vllm',
      },
    });

    const result = await callBackstagePrinters(
      'owner',
      'production',
      is,
      false,
      logger,
    );

    expect(result.modelServer!.tags).toContain('app-kubernetes-io-name-vllm');
  });

  it('should override owner, lifecycle, and description via annotations', async () => {
    const is = makeInferenceService({
      annotations: {
        'rhdh.io/owner': 'custom-owner',
        'rhdh.io/lifecycle': 'experimental',
        'rhdh.io/description': 'Custom description',
      },
    });

    const result = await callBackstagePrinters(
      'default-owner',
      'production',
      is,
      false,
      logger,
    );

    expect(result.models[0].owner).toBe('custom-owner');
    expect(result.models[0].lifecycle).toBe('experimental');
    expect(result.models[0].description).toBe('Custom description');
  });

  it('should auto-set TechDocsKey when catalog annotations are present', async () => {
    const is = makeInferenceService({
      annotations: {
        [CATALOG_SOURCE_ANNOTATION]: 'rhoai-catalog',
        [CATALOG_MODEL_ANNOTATION]: 'granite-8b',
      },
    });

    const result = await callBackstagePrinters(
      'owner',
      'production',
      is,
      false,
      logger,
    );

    expect(result.models[0].annotations?.techdocs).toBe(
      '/modelcard/rhoai-catalog/granite-8b',
    );
  });

  it('should NOT auto-set TechDocsKey when explicit techdocs annotation exists', async () => {
    const is = makeInferenceService({
      annotations: {
        'rhdh.io/techdocs': 'https://example.com/docs',
        [CATALOG_SOURCE_ANNOTATION]: 'rhoai-catalog',
        [CATALOG_MODEL_ANNOTATION]: 'granite-8b',
      },
    });

    const result = await callBackstagePrinters(
      'owner',
      'production',
      is,
      false,
      logger,
    );

    expect(result.models[0].annotations?.techdocs).toBe(
      'https://example.com/docs',
    );
  });

  it('should set API type from annotation - graphql', async () => {
    const is = makeInferenceService({
      annotations: {
        'rhdh.io/api-type': 'graphql',
      },
      status: {
        url: 'https://model.example.com',
      },
    });

    const result = await callBackstagePrinters(
      'owner',
      'production',
      is,
      false,
      logger,
    );

    expect(result.modelServer!.API!.type).toBe('graphql');
  });

  it('should set API type from annotation - grpc', async () => {
    const is = makeInferenceService({
      annotations: {
        'rhdh.io/api-type': 'grpc',
      },
      status: {
        url: 'https://model.example.com',
      },
    });

    const result = await callBackstagePrinters(
      'owner',
      'production',
      is,
      false,
      logger,
    );

    expect(result.modelServer!.API!.type).toBe('grpc');
  });

  it('should set API type from annotation - asyncapi', async () => {
    const is = makeInferenceService({
      annotations: {
        'rhdh.io/api-type': 'asyncapi',
      },
      status: {
        url: 'https://model.example.com',
      },
    });

    const result = await callBackstagePrinters(
      'owner',
      'production',
      is,
      false,
      logger,
    );

    expect(result.modelServer!.API!.type).toBe('asyncapi');
  });

  it('should default API type to openapi', async () => {
    const is = makeInferenceService({
      status: {
        url: 'https://model.example.com',
      },
    });

    const result = await callBackstagePrinters(
      'owner',
      'production',
      is,
      false,
      logger,
    );

    expect(result.modelServer!.API!.type).toBe('openapi');
  });

  it('should set authentication flag to true', async () => {
    const is = makeInferenceService({
      status: {
        url: 'https://model.example.com',
      },
    });

    const result = await callBackstagePrinters(
      'owner',
      'production',
      is,
      true,
      logger,
    );

    expect(result.modelServer!.authentication).toBe(true);
  });

  it('should set authentication flag to false', async () => {
    const is = makeInferenceService({
      status: {
        url: 'https://model.example.com',
      },
    });

    const result = await callBackstagePrinters(
      'owner',
      'production',
      is,
      false,
      logger,
    );

    expect(result.modelServer!.authentication).toBe(false);
  });

  it('should get artifactLocationURL from storageURI', async () => {
    const is = makeInferenceService({
      spec: {
        predictor: {
          model: {
            storageURI: 's3://bucket/model',
            modelFormat: { name: 'onnx' },
          },
        },
      },
    });

    const result = await callBackstagePrinters(
      'owner',
      'production',
      is,
      false,
      logger,
    );

    expect(result.models[0].artifactLocationURL).toBe('s3://bucket/model');
  });

  it('should get artifactLocationURL from storage.path', async () => {
    const is = makeInferenceService({
      spec: {
        predictor: {
          model: {
            storage: { path: 'bucket/model-path' },
            modelFormat: { name: 'onnx' },
          },
        },
      },
    });

    const result = await callBackstagePrinters(
      'owner',
      'production',
      is,
      false,
      logger,
    );

    expect(result.models[0].artifactLocationURL).toBe('s3://bucket/model-path');
  });

  it('should use status.url for API url', async () => {
    const is = makeInferenceService({
      status: {
        url: 'https://model.example.com',
      },
    });

    const result = await callBackstagePrinters(
      'owner',
      'production',
      is,
      false,
      logger,
    );

    expect(result.modelServer!.API!.url).toBe('https://model.example.com');
  });

  it('should fall back to status.address.url for API url', async () => {
    const is = makeInferenceService({
      status: {
        address: { url: 'https://internal.example.com' },
      },
    });

    const result = await callBackstagePrinters(
      'owner',
      'production',
      is,
      false,
      logger,
    );

    expect(result.modelServer!.API!.url).toBe('https://internal.example.com');
  });

  it('should set API spec from annotation', async () => {
    const is = makeInferenceService({
      annotations: {
        'rhdh.io/api-spec': 'https://example.com/openapi.json',
      },
    });

    const result = await callBackstagePrinters(
      'owner',
      'production',
      is,
      false,
      logger,
    );

    expect(result.modelServer!.API!.spec).toBe(
      'https://example.com/openapi.json',
    );
  });

  it('should default API spec to TBD', async () => {
    const is = makeInferenceService();

    const result = await callBackstagePrinters(
      'owner',
      'production',
      is,
      false,
      logger,
    );

    expect(result.modelServer!.API!.spec).toBe('TBD');
  });

  it('should set homepage URL from annotation', async () => {
    const is = makeInferenceService({
      annotations: {
        'rhdh.io/homepage-url': 'https://homepage.example.com',
      },
    });

    const result = await callBackstagePrinters(
      'owner',
      'production',
      is,
      false,
      logger,
    );

    expect(result.modelServer!.homepageURL).toBe(
      'https://homepage.example.com',
    );
  });

  it('should propagate system, serverType, default, owner, and lifecycle annotations to modelServer', async () => {
    const is = makeInferenceService({
      annotations: {
        [SYSTEM_ANNOTATION]: 'my-system',
        [SERVER_TYPE_ANNOTATION]: 'custom-server',
        [DEFAULT_ANNOTATION]: 'preferred-model',
        [OWNER_ANNOTATION]: 'team-ai',
        [LIFECYCLE_ANNOTATION]: 'experimental',
      },
    });

    const result = await callBackstagePrinters(
      'default-owner',
      'production',
      is,
      false,
      logger,
    );

    expect(result.modelServer!.annotations).toBeDefined();
    expect(result.modelServer!.annotations![SYSTEM_ANNOTATION]).toBe(
      'my-system',
    );
    expect(result.modelServer!.annotations![SERVER_TYPE_ANNOTATION]).toBe(
      'custom-server',
    );
    expect(result.modelServer!.annotations![DEFAULT_ANNOTATION]).toBe(
      'preferred-model',
    );
    expect(result.modelServer!.annotations![OWNER_ANNOTATION]).toBe('team-ai');
    expect(result.modelServer!.annotations![LIFECYCLE_ANNOTATION]).toBe(
      'experimental',
    );
  });

  it('should not set modelServer annotations when none of the propagated annotations are present', async () => {
    const is = makeInferenceService({
      annotations: {
        'rhdh.io/description': 'Custom description',
      },
    });

    const result = await callBackstagePrinters(
      'owner',
      'production',
      is,
      false,
      logger,
    );

    expect(result.modelServer!.annotations).toBeUndefined();
  });

  it('should create models from model- prefix annotations', async () => {
    const is = makeInferenceService({
      annotations: {
        [`${MODEL_PREFIX_ANNOTATION}granite`]: 'ibm-granite-8b',
        [`${MODEL_PREFIX_ANNOTATION}llama`]: 'meta-llama-3',
      },
    });

    const result = await callBackstagePrinters(
      'owner',
      'production',
      is,
      false,
      logger,
    );

    expect(result.models).toHaveLength(2);
    const modelNames = result.models.map(m => m.name);
    expect(modelNames).toContain('ibm-granite-8b');
    expect(modelNames).toContain('meta-llama-3');
  });

  it('should not create default model when model- prefix annotations exist', async () => {
    const is = makeInferenceService({
      name: 'my-inference-service',
      namespace: 'ns',
      annotations: {
        [`${MODEL_PREFIX_ANNOTATION}granite`]: 'ibm-granite-8b',
      },
    });

    const result = await callBackstagePrinters(
      'owner',
      'production',
      is,
      false,
      logger,
    );

    expect(result.models).toHaveLength(1);
    expect(result.models[0].name).toBe('ibm-granite-8b');
    // The default name ns_my-inference-service should NOT be present
    expect(result.models[0].name).not.toBe('ns-my-inference-service');
  });

  it('should create default model when no model- prefix annotations exist', async () => {
    const is = makeInferenceService({
      name: 'test-model',
      namespace: 'vllm',
    });

    const result = await callBackstagePrinters(
      'owner',
      'production',
      is,
      false,
      logger,
    );

    expect(result.models).toHaveLength(1);
    expect(result.models[0].name).toBe('vllm-test-model');
  });

  it('should sanitize rhdh.io/default annotation value via sanitizeName', async () => {
    const is = makeInferenceService({
      annotations: {
        [DEFAULT_ANNOTATION]: 'IBM_Granite_8B',
      },
    });

    const result = await callBackstagePrinters(
      'owner',
      'production',
      is,
      false,
      logger,
    );

    // sanitizeName lowercases and replaces non-alphanumeric with dashes,
    // ensuring the default value matches the format of model names in
    // spec.models.available.
    expect(result.modelServer!.annotations![DEFAULT_ANNOTATION]).toBe(
      'ibm-granite-8b',
    );
  });

  it('should sort model- prefix models by name for deterministic order', async () => {
    const is = makeInferenceService({
      annotations: {
        [`${MODEL_PREFIX_ANNOTATION}z-model`]: 'zebra-model',
        [`${MODEL_PREFIX_ANNOTATION}a-model`]: 'alpha-model',
        [`${MODEL_PREFIX_ANNOTATION}m-model`]: 'middle-model',
      },
    });

    const result = await callBackstagePrinters(
      'owner',
      'production',
      is,
      false,
      logger,
    );

    expect(result.models).toHaveLength(3);
    expect(result.models[0].name).toBe('alpha-model');
    expect(result.models[1].name).toBe('middle-model');
    expect(result.models[2].name).toBe('zebra-model');
  });
});
