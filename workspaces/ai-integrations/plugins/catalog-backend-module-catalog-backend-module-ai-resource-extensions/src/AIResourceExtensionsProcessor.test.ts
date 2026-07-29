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
import {
  AIResourceExtensionsProcessor,
  VALID_AI_RESOURCE_SCOPES,
} from './AIResourceExtensionsProcessor';

function makeAIResource(spec: Entity['spec'] = {}): Entity {
  return {
    apiVersion: 'backstage.io/v1beta1',
    kind: 'AIResource',
    metadata: { name: 'test-resource' },
    spec,
  };
}

describe('AIResourceExtensionsProcessor', () => {
  let processor: AIResourceExtensionsProcessor;
  const location = { type: 'url', target: 'https://example.com' };
  const emit = jest.fn();

  beforeEach(() => {
    processor = new AIResourceExtensionsProcessor();
    emit.mockClear();
  });

  it('should return processor name', () => {
    expect(processor.getProcessorName()).toBe('AIResourceExtensionsProcessor');
  });

  describe('valid scope values', () => {
    it.each(VALID_AI_RESOURCE_SCOPES)(
      'should accept spec.scope: %s',
      async scope => {
        const entity = makeAIResource({ scope });

        const result = await processor.preProcessEntity(entity, location, emit);

        expect(result).toEqual(entity);
      },
    );
  });

  describe('omitted scope', () => {
    it('should accept entity without spec.scope', async () => {
      const entity = makeAIResource({});

      const result = await processor.preProcessEntity(entity, location, emit);

      expect(result).toEqual(entity);
    });

    it('should accept entity with undefined spec.scope', async () => {
      const entity = makeAIResource({ scope: undefined });

      const result = await processor.preProcessEntity(entity, location, emit);

      expect(result).toEqual(entity);
    });

    it('should accept entity with no spec property', async () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1beta1',
        kind: 'AIResource',
        metadata: { name: 'test-resource' },
      };

      const result = await processor.preProcessEntity(entity, location, emit);

      expect(result).toEqual(entity);
    });
  });

  describe('invalid scope', () => {
    it('should reject invalid spec.scope value', async () => {
      const entity = makeAIResource({ scope: 'enterprise' });

      await expect(
        processor.preProcessEntity(entity, location, emit),
      ).rejects.toThrow('Validation failed for AIResource entity');
    });

    it('should include field path in error', async () => {
      const entity = makeAIResource({ scope: 'enterprise' });

      await expect(
        processor.preProcessEntity(entity, location, emit),
      ).rejects.toThrow('spec.scope');
    });

    it('should include received value in error', async () => {
      const entity = makeAIResource({ scope: 'enterprise' });

      await expect(
        processor.preProcessEntity(entity, location, emit),
      ).rejects.toThrow("'enterprise'");
    });

    it('should include accepted values in error', async () => {
      const entity = makeAIResource({ scope: 'enterprise' });

      await expect(
        processor.preProcessEntity(entity, location, emit),
      ).rejects.toThrow("'organization', 'product', 'team'");
    });

    it('should reject empty string scope', async () => {
      const entity = makeAIResource({ scope: '' });

      await expect(
        processor.preProcessEntity(entity, location, emit),
      ).rejects.toThrow('spec.scope');
    });

    it('should reject numeric scope value', async () => {
      const entity = makeAIResource({ scope: 42 });

      await expect(
        processor.preProcessEntity(entity, location, emit),
      ).rejects.toThrow("spec.scope has invalid value '42'");
    });

    it('should reject null scope value', async () => {
      const entity = makeAIResource({ scope: null });

      await expect(
        processor.preProcessEntity(entity, location, emit),
      ).rejects.toThrow('spec.scope');
    });
  });

  describe('error quality', () => {
    it('should not expose internal class names in error', async () => {
      const entity = makeAIResource({ scope: 'invalid' });

      const error = await processor
        .preProcessEntity(entity, location, emit)
        .catch((e: Error) => e);

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).not.toMatch(
        /AIResourceExtensionsProcessor/,
      );
    });

    it('should not expose stack trace patterns in error message', async () => {
      const entity = makeAIResource({ scope: 'invalid' });

      const error = await processor
        .preProcessEntity(entity, location, emit)
        .catch((e: Error) => e);

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).not.toMatch(/at\s+\w+\.\w+\s+\(/);
    });
  });

  describe('OCI validation in extensions processor', () => {
    it('should reject OCI target without oci:// prefix', async () => {
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

    it('should reject empty OCI target', async () => {
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

    it('should accept a valid OCI target', async () => {
      const entity = makeAIResource({
        location: {
          type: 'oci',
          target: 'oci://quay.io/org/model:latest',
        },
      });

      const result = await processor.preProcessEntity(entity, location, emit);

      expect(result).toEqual(entity);
    });
  });

  describe('multiple extension errors reported together', () => {
    it('should report both scope and OCI errors in a single response', async () => {
      const entity = makeAIResource({
        scope: 'invalid',
        location: {
          type: 'oci',
          target: 'quay.io/myorg/skills:latest',
        },
      });

      const error = await processor
        .preProcessEntity(entity, location, emit)
        .catch((e: Error) => e);

      expect(error).toBeInstanceOf(Error);
      const message = (error as Error).message;
      expect(message).toContain('spec.scope');
      expect(message).toContain('spec.location.target');
    });

    it('should include field path and value for scope error', async () => {
      const entity = makeAIResource({
        scope: 'invalid',
        location: {
          type: 'oci',
          target: 'quay.io/myorg/skills:latest',
        },
      });

      const error = await processor
        .preProcessEntity(entity, location, emit)
        .catch((e: Error) => e);

      const message = (error as Error).message;
      expect(message).toContain("'invalid'");
      expect(message).toContain("'organization', 'product', 'team'");
    });

    it('should include field path and constraint for OCI error', async () => {
      const entity = makeAIResource({
        scope: 'invalid',
        location: {
          type: 'oci',
          target: 'quay.io/myorg/skills:latest',
        },
      });

      const error = await processor
        .preProcessEntity(entity, location, emit)
        .catch((e: Error) => e);

      const message = (error as Error).message;
      expect(message).toContain('oci:// prefix');
    });

    it('should not expose internal class names in multi-error response', async () => {
      const entity = makeAIResource({
        scope: 'invalid',
        location: {
          type: 'oci',
          target: 'quay.io/myorg/skills:latest',
        },
      });

      const error = await processor
        .preProcessEntity(entity, location, emit)
        .catch((e: Error) => e);

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).not.toMatch(
        /AIResourceExtensionsProcessor/,
      );
      expect((error as Error).message).not.toMatch(/AIResourceOciProcessor/);
    });

    it('should not expose stack traces in multi-error response', async () => {
      const entity = makeAIResource({
        scope: 'invalid',
        location: {
          type: 'oci',
          target: 'quay.io/myorg/skills:latest',
        },
      });

      const error = await processor
        .preProcessEntity(entity, location, emit)
        .catch((e: Error) => e);

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).not.toMatch(/at\s+\w+\.\w+\s+\(/);
    });

    it('should return single error when only scope is invalid', async () => {
      const entity = makeAIResource({ scope: 'enterprise' });

      const error = await processor
        .preProcessEntity(entity, location, emit)
        .catch((e: Error) => e);

      const message = (error as Error).message;
      expect(message).toContain('spec.scope');
      expect(message).not.toContain('spec.location.target');
    });

    it('should return single error when only OCI target is invalid', async () => {
      const entity = makeAIResource({
        scope: 'organization',
        location: {
          type: 'oci',
          target: 'quay.io/myorg/skills:latest',
        },
      });

      const error = await processor
        .preProcessEntity(entity, location, emit)
        .catch((e: Error) => e);

      const message = (error as Error).message;
      expect(message).not.toContain('spec.scope');
      expect(message).toContain('spec.location.target');
    });

    it('should pass valid entity without errors', async () => {
      const entity = makeAIResource({
        scope: 'team',
        location: {
          type: 'oci',
          target: 'oci://quay.io/myorg/skills:latest',
        },
      });

      const result = await processor.preProcessEntity(entity, location, emit);

      expect(result).toEqual(entity);
    });
  });

  describe('non-AIResource entities', () => {
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

    it('should not validate scope on non-AIResource kinds', async () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Resource',
        metadata: { name: 'my-resource' },
        spec: { type: 'database', owner: 'team-a', scope: 'invalid' },
      };

      const result = await processor.preProcessEntity(entity, location, emit);

      expect(result).toEqual(entity);
    });
  });
});
