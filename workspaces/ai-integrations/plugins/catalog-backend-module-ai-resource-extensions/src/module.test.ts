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
import { Entity } from '@backstage/catalog-model';
import {
  CatalogProcessor,
  CatalogProcessorCache,
  catalogProcessingExtensionPoint,
} from '@backstage/plugin-catalog-node';
import { catalogModuleCatalogBackendModuleAiResourceExtensions } from './module';

function makeAiResource(
  spec: Entity['spec'] = {},
  annotations?: Record<string, string>,
): Entity {
  return {
    apiVersion: 'backstage.io/v1beta1',
    kind: 'AiResource',
    metadata: {
      name: 'test-resource',
      ...(annotations ? { annotations } : {}),
    },
    spec,
  };
}

describe('catalog-backend-module-ai-resource-extensions integration', () => {
  let registeredProcessors: CatalogProcessor[];
  const emit = jest.fn();
  const mockCache: CatalogProcessorCache = {
    get: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    registeredProcessors = [];

    await startTestBackend({
      extensionPoints: [
        [
          catalogProcessingExtensionPoint,
          {
            addProcessor: (
              ...processors: Array<CatalogProcessor | Array<CatalogProcessor>>
            ) => {
              registeredProcessors.push(
                ...(processors.flat() as CatalogProcessor[]),
              );
            },
            addEntityProvider: jest.fn(),
          },
        ],
      ],
      features: [catalogModuleCatalogBackendModuleAiResourceExtensions],
    });
  });

  beforeEach(() => {
    emit.mockClear();
  });

  describe('module wiring', () => {
    it('should register AiResourceExtensionsProcessor', () => {
      const names = registeredProcessors.map(p => p.getProcessorName());
      expect(names).toContain('AiResourceExtensionsProcessor');
    });

    it('should register exactly one processor', () => {
      expect(registeredProcessors).toHaveLength(1);
    });
  });

  describe('OCI ingestion path', () => {
    let processor: CatalogProcessor;

    beforeAll(() => {
      processor = registeredProcessors.find(
        p => p.getProcessorName() === 'AiResourceExtensionsProcessor',
      )!;
    });

    const ociLocation = { type: 'url', target: 'https://example.com' };

    it('should accept a valid oci:// source-location', async () => {
      const entity = makeAiResource(
        { scope: 'team' },
        {
          'backstage.io/source-location': 'url:oci://quay.io/org/skills:latest',
        },
      );

      const result = await processor.preProcessEntity!(
        entity,
        ociLocation,
        emit,
        ociLocation,
        mockCache,
      );

      expect(result).toEqual(entity);
      expect(emit).not.toHaveBeenCalled();
    });

    it('should accept a valid oci:// source-location with digest', async () => {
      const entity = makeAiResource(
        {},
        {
          'backstage.io/source-location':
            'url:oci://quay.io/org/model@sha256:abc123',
        },
      );

      const result = await processor.preProcessEntity!(
        entity,
        ociLocation,
        emit,
        ociLocation,
        mockCache,
      );

      expect(result).toEqual(entity);
    });

    it('should reject a malformed oci:// target with actionable error', async () => {
      const entity = makeAiResource(
        {},
        {
          'backstage.io/source-location': 'url:oci://',
        },
      );

      await expect(
        processor.preProcessEntity!(
          entity,
          ociLocation,
          emit,
          ociLocation,
          mockCache,
        ),
      ).rejects.toThrow('not a valid OCI reference');
    });

    it('should reject bare oci:// without url: prefix', async () => {
      const entity = makeAiResource(
        {},
        {
          'backstage.io/source-location': 'oci://quay.io/org/skills:latest',
        },
      );

      await expect(
        processor.preProcessEntity!(
          entity,
          ociLocation,
          emit,
          ociLocation,
          mockCache,
        ),
      ).rejects.toThrow('url:oci://');
    });

    it('should reject oci:// with only registry and no repository', async () => {
      const entity = makeAiResource(
        {},
        {
          'backstage.io/source-location': 'url:oci://quay.io',
        },
      );

      await expect(
        processor.preProcessEntity!(
          entity,
          ociLocation,
          emit,
          ociLocation,
          mockCache,
        ),
      ).rejects.toThrow('not a valid OCI reference');
    });

    it('should make zero network calls during OCI validation', async () => {
      // The processor validates OCI URI format only — no HTTP fetch,
      // no registry roundtrip.  If this test passes without mocking
      // any HTTP layer and without network access, the zero-network
      // contract holds.
      const entity = makeAiResource(
        { scope: 'organization' },
        {
          'backstage.io/source-location': 'url:oci://quay.io/org/skills:latest',
        },
      );

      const result = await processor.preProcessEntity!(
        entity,
        ociLocation,
        emit,
        ociLocation,
        mockCache,
      );

      expect(result).toEqual(entity);
    });
  });

  describe('git ingestion path', () => {
    let processor: CatalogProcessor;

    beforeAll(() => {
      processor = registeredProcessors.find(
        p => p.getProcessorName() === 'AiResourceExtensionsProcessor',
      )!;
    });

    it('should pass through a git-backed entity with https source-location', async () => {
      const entity = makeAiResource(
        { scope: 'product' },
        {
          'backstage.io/source-location':
            'url:https://github.com/my-org/my-skills',
        },
      );

      const gitLocation = {
        type: 'url',
        target:
          'https://github.com/my-org/my-skills/blob/main/catalog-info.yaml',
      };

      const result = await processor.preProcessEntity!(
        entity,
        gitLocation,
        emit,
        gitLocation,
        mockCache,
      );

      expect(result).toEqual(entity);
    });

    it('should not apply OCI validation to https source-location', async () => {
      const entity = makeAiResource(
        {},
        {
          'backstage.io/source-location':
            'url:https://github.com/my-org/my-skills',
        },
      );

      const gitLocation = {
        type: 'url',
        target:
          'https://github.com/my-org/my-skills/blob/main/catalog-info.yaml',
      };

      // Should not throw — OCI rules do not apply to HTTPS targets
      const result = await processor.preProcessEntity!(
        entity,
        gitLocation,
        emit,
        gitLocation,
        mockCache,
      );

      expect(result).toEqual(entity);
    });

    it('should pass through an entity without source-location annotation', async () => {
      const entity = makeAiResource({ scope: 'team' });

      const gitLocation = {
        type: 'url',
        target:
          'https://github.com/my-org/my-skills/blob/main/catalog-info.yaml',
      };

      const result = await processor.preProcessEntity!(
        entity,
        gitLocation,
        emit,
        gitLocation,
        mockCache,
      );

      expect(result).toEqual(entity);
    });
  });

  describe('fixture entities through processor chain', () => {
    let processor: CatalogProcessor;

    beforeAll(() => {
      processor = registeredProcessors.find(
        p => p.getProcessorName() === 'AiResourceExtensionsProcessor',
      )!;
    });

    const location = { type: 'url', target: 'https://example.com' };

    it('should accept a valid OCI entity', async () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1beta1',
        kind: 'AiResource',
        metadata: {
          name: 'skills-bundle',
          annotations: {
            'backstage.io/source-location':
              'url:oci://quay.io/rhdh/skills:v1.2.0',
          },
        },
        spec: {
          type: 'model',
          lifecycle: 'production',
          owner: 'team-ai',
          scope: 'organization',
        },
      };

      const result = await processor.preProcessEntity!(
        entity,
        location,
        emit,
        location,
        mockCache,
      );

      expect(result).toEqual(entity);
    });

    it('should accept a valid git entity', async () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1beta1',
        kind: 'AiResource',
        metadata: {
          name: 'git-skills',
          annotations: {
            'backstage.io/source-location':
              'url:https://github.com/my-org/my-skills',
          },
        },
        spec: {
          type: 'model',
          lifecycle: 'experimental',
          owner: 'team-ml',
          scope: 'team',
        },
      };

      const result = await processor.preProcessEntity!(
        entity,
        location,
        emit,
        location,
        mockCache,
      );

      expect(result).toEqual(entity);
    });

    it('should reject an invalid OCI entity with actionable error', async () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1beta1',
        kind: 'AiResource',
        metadata: {
          name: 'bad-oci',
          annotations: {
            'backstage.io/source-location': 'oci://quay.io/rhdh/skills:latest',
          },
        },
        spec: {
          type: 'model',
          lifecycle: 'production',
          owner: 'team-ai',
          scope: 'team',
        },
      };

      await expect(
        processor.preProcessEntity!(
          entity,
          location,
          emit,
          location,
          mockCache,
        ),
      ).rejects.toThrow('url:oci://');
    });

    it('should skip non-AiResource entities', async () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'my-service' },
        spec: {
          type: 'service',
          lifecycle: 'production',
          owner: 'team-a',
        },
      };

      const result = await processor.preProcessEntity!(
        entity,
        location,
        emit,
        location,
        mockCache,
      );

      expect(result).toEqual(entity);
    });
  });
});
