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
  AIResourceScopeValidator,
  VALID_AI_RESOURCE_SCOPES,
} from './AIResourceScopeValidator';

function makeAIResource(spec: Record<string, unknown> = {}): Entity {
  return {
    apiVersion: 'backstage.io/v1beta1',
    kind: 'AIResource',
    metadata: { name: 'test-resource' },
    spec,
  };
}

describe('AIResourceScopeValidator', () => {
  let processor: AIResourceScopeValidator;
  const location = { type: 'url', target: 'https://example.com' };
  const emit = jest.fn();

  beforeEach(() => {
    processor = new AIResourceScopeValidator();
    emit.mockClear();
  });

  it('should return processor name', () => {
    expect(processor.getProcessorName()).toBe('AIResourceScopeValidator');
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
  });

  describe('error quality', () => {
    it('should not expose internal class names in error', async () => {
      const entity = makeAIResource({ scope: 'invalid' });

      await expect(
        processor.preProcessEntity(entity, location, emit),
      ).rejects.toThrow(
        expect.not.objectContaining({
          message: expect.stringMatching(/AIResourceScopeValidator/),
        }),
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
