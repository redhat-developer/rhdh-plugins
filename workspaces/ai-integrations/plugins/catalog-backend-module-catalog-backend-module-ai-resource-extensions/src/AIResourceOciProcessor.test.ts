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

import { Entity } from '@backstage/catalog-model';
import { AIResourceOciProcessor } from './AIResourceOciProcessor';

function makeAIResource(spec: Entity['spec'] = {}): Entity {
  return {
    apiVersion: 'backstage.io/v1beta1',
    kind: 'AIResource',
    metadata: { name: 'test-resource' },
    spec,
  };
}

describe('AIResourceOciProcessor', () => {
  let processor: AIResourceOciProcessor;
  const location = { type: 'url', target: 'https://example.com' };
  const emit = jest.fn();

  beforeEach(() => {
    processor = new AIResourceOciProcessor();
    emit.mockClear();
  });

  it('should return processor name', () => {
    expect(processor.getProcessorName()).toBe('AIResourceOciProcessor');
  });

  describe('valid OCI targets', () => {
    it('should accept a valid oci:// target', async () => {
      const entity = makeAIResource({
        location: {
          type: 'oci',
          target: 'oci://quay.io/org/model:latest',
        },
      });

      const result = await processor.preProcessEntity(entity, location, emit);

      expect(result).toEqual(entity);
    });

    it('should accept an OCI target with a digest', async () => {
      const entity = makeAIResource({
        location: {
          type: 'oci',
          target:
            'oci://quay.io/org/model@sha256:abc123def456789012345678901234567890123456789012345678901234',
        },
      });

      const result = await processor.preProcessEntity(entity, location, emit);

      expect(result).toEqual(entity);
    });

    it('should accept an OCI target without a tag', async () => {
      const entity = makeAIResource({
        location: {
          type: 'oci',
          target: 'oci://registry.example.com/org/repo',
        },
      });

      const result = await processor.preProcessEntity(entity, location, emit);

      expect(result).toEqual(entity);
    });

    it('should accept an OCI target with nested path', async () => {
      const entity = makeAIResource({
        location: {
          type: 'oci',
          target: 'oci://registry.example.com/org/sub/repo:v1',
        },
      });

      const result = await processor.preProcessEntity(entity, location, emit);

      expect(result).toEqual(entity);
    });
  });

  describe('malformed OCI targets', () => {
    it('should reject target without oci:// prefix', async () => {
      const entity = makeAIResource({
        location: {
          type: 'oci',
          target: 'quay.io/org/model:latest',
        },
      });

      await expect(
        processor.preProcessEntity(entity, location, emit),
      ).rejects.toThrow('must start with the oci:// prefix');
    });

    it('should include the invalid value in the error', async () => {
      const entity = makeAIResource({
        location: {
          type: 'oci',
          target: 'quay.io/org/model:latest',
        },
      });

      await expect(
        processor.preProcessEntity(entity, location, emit),
      ).rejects.toThrow("'quay.io/org/model:latest'");
    });

    it('should reject empty target string', async () => {
      const entity = makeAIResource({
        location: {
          type: 'oci',
          target: '',
        },
      });

      await expect(
        processor.preProcessEntity(entity, location, emit),
      ).rejects.toThrow('must be a non-empty string');
    });

    it('should reject whitespace-only target', async () => {
      const entity = makeAIResource({
        location: {
          type: 'oci',
          target: '   ',
        },
      });

      await expect(
        processor.preProcessEntity(entity, location, emit),
      ).rejects.toThrow('must be a non-empty string');
    });

    it('should reject oci:// with no path', async () => {
      const entity = makeAIResource({
        location: {
          type: 'oci',
          target: 'oci://',
        },
      });

      await expect(
        processor.preProcessEntity(entity, location, emit),
      ).rejects.toThrow('not a valid OCI reference');
    });

    it('should reject oci:// with registry but no repository path', async () => {
      const entity = makeAIResource({
        location: {
          type: 'oci',
          target: 'oci://quay.io',
        },
      });

      await expect(
        processor.preProcessEntity(entity, location, emit),
      ).rejects.toThrow('not a valid OCI reference');
    });

    it('should reject oci:// with no registry (triple slash)', async () => {
      const entity = makeAIResource({
        location: {
          type: 'oci',
          target: 'oci:///foo',
        },
      });

      await expect(
        processor.preProcessEntity(entity, location, emit),
      ).rejects.toThrow('not a valid OCI reference');
    });

    it('should reject oci:// with registry but empty repository', async () => {
      const entity = makeAIResource({
        location: {
          type: 'oci',
          target: 'oci://host/',
        },
      });

      await expect(
        processor.preProcessEntity(entity, location, emit),
      ).rejects.toThrow('not a valid OCI reference');
    });

    it('should reject oci:// with trailing slash after repository', async () => {
      const entity = makeAIResource({
        location: {
          type: 'oci',
          target: 'oci://registry/repo/',
        },
      });

      await expect(
        processor.preProcessEntity(entity, location, emit),
      ).rejects.toThrow('not a valid OCI reference');
    });

    it('should reject target with leading whitespace', async () => {
      const entity = makeAIResource({
        location: {
          type: 'oci',
          target: ' oci://quay.io/org/model:tag',
        },
      });

      await expect(
        processor.preProcessEntity(entity, location, emit),
      ).rejects.toThrow('must not have leading or trailing whitespace');
    });

    it('should reject oci:// with whitespace in the registry segment', async () => {
      const entity = makeAIResource({
        location: {
          type: 'oci',
          target: 'oci:// quay.io/org/model',
        },
      });

      await expect(
        processor.preProcessEntity(entity, location, emit),
      ).rejects.toThrow('not a valid OCI reference');
    });

    it('should reject missing target field', async () => {
      const entity = makeAIResource({
        location: {
          type: 'oci',
        },
      });

      await expect(
        processor.preProcessEntity(entity, location, emit),
      ).rejects.toThrow('must be a non-empty string');
    });

    it('should reject numeric target', async () => {
      const entity = makeAIResource({
        location: {
          type: 'oci',
          target: 42,
        },
      });

      await expect(
        processor.preProcessEntity(entity, location, emit),
      ).rejects.toThrow('must be a non-empty string');
    });

    it('should include expected format hint in error', async () => {
      const entity = makeAIResource({
        location: {
          type: 'oci',
          target: 'http://quay.io/org/model',
        },
      });

      await expect(
        processor.preProcessEntity(entity, location, emit),
      ).rejects.toThrow('oci://quay.io/org/model:tag');
    });
  });

  describe('non-OCI entities pass through', () => {
    it('should pass through AIResource with git location type', async () => {
      const entity = makeAIResource({
        location: {
          type: 'git',
          target: 'https://github.com/org/repo',
        },
      });

      const result = await processor.preProcessEntity(entity, location, emit);

      expect(result).toEqual(entity);
    });

    it('should pass through AIResource without location', async () => {
      const entity = makeAIResource({
        owner: 'team-a',
      });

      const result = await processor.preProcessEntity(entity, location, emit);

      expect(result).toEqual(entity);
    });

    it('should pass through AIResource with no spec', async () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1beta1',
        kind: 'AIResource',
        metadata: { name: 'test-resource' },
      };

      const result = await processor.preProcessEntity(entity, location, emit);

      expect(result).toEqual(entity);
    });
  });

  describe('non-AIResource entities ignored', () => {
    it('should pass through Component entities unchanged', async () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'my-component' },
        spec: { type: 'service', lifecycle: 'production', owner: 'team-a' },
      };

      const result = await processor.preProcessEntity(entity, location, emit);

      expect(result).toEqual(entity);
    });

    it('should not validate OCI target on non-AIResource kinds', async () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Resource',
        metadata: { name: 'my-resource' },
        spec: {
          type: 'database',
          owner: 'team-a',
          location: { type: 'oci', target: 'invalid' },
        },
      };

      const result = await processor.preProcessEntity(entity, location, emit);

      expect(result).toEqual(entity);
    });
  });

  describe('zero network calls', () => {
    it('should not call global fetch during processing', async () => {
      const fetchSpy = jest.spyOn(globalThis, 'fetch');

      const entity = makeAIResource({
        location: {
          type: 'oci',
          target: 'oci://quay.io/org/model:latest',
        },
      });

      await processor.preProcessEntity(entity, location, emit);

      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    });

    it('should not call fetch even for invalid targets', async () => {
      const fetchSpy = jest.spyOn(globalThis, 'fetch');

      const entity = makeAIResource({
        location: {
          type: 'oci',
          target: 'quay.io/org/model:latest',
        },
      });

      await processor.preProcessEntity(entity, location, emit).catch(() => {});

      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    });
  });

  describe('error quality', () => {
    it('should not expose internal class names in error', async () => {
      const entity = makeAIResource({
        location: {
          type: 'oci',
          target: 'invalid',
        },
      });

      const error = await processor
        .preProcessEntity(entity, location, emit)
        .catch((e: Error) => e);

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).not.toMatch(/AIResourceOciProcessor/);
    });

    it('should include field path in error', async () => {
      const entity = makeAIResource({
        location: {
          type: 'oci',
          target: 'invalid',
        },
      });

      await expect(
        processor.preProcessEntity(entity, location, emit),
      ).rejects.toThrow('spec.location.target');
    });
  });
});
