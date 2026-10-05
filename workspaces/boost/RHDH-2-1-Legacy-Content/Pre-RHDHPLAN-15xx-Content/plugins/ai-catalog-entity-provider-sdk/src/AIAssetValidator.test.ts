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

import type { Entity } from '@backstage/catalog-model';
import { AIAssetValidator } from './AIAssetValidator';

function makeEntity(annotations: Record<string, string>): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Resource',
    metadata: {
      name: 'test-entity',
      annotations,
    },
  };
}

describe('AIAssetValidator', () => {
  let validator: AIAssetValidator;

  beforeEach(() => {
    validator = new AIAssetValidator();
  });

  it('has the correct processor name', () => {
    expect(validator.getProcessorName()).toBe('AIAssetValidator');
  });

  describe('entities without AI asset annotations', () => {
    it('returns false for entities without any ai-asset annotations', async () => {
      const entity = makeEntity({
        'backstage.io/managed-by-location': 'url:https://example.com',
      });
      const result = await validator.validateEntityKind(entity);
      expect(result).toBe(false);
    });

    it('returns false for entities with no annotations', async () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'test' },
      };
      const result = await validator.validateEntityKind(entity);
      expect(result).toBe(false);
    });
  });

  describe('valid AI asset entities', () => {
    it('returns false for a valid AI asset entity (delegates kind validation)', async () => {
      const entity = makeEntity({
        'rhdh.io/ai-asset-category': 'agent',
        'rhdh.io/ai-asset-version': '1.0.0',
        'rhdh.io/ai-asset-source': 'kagenti/default',
      });
      const result = await validator.validateEntityKind(entity);
      expect(result).toBe(false);
    });

    it('accepts all valid category values', async () => {
      const categories = [
        'agent',
        'skill',
        'rule',
        'skill-bundle',
        'mcp-server',
        'ai-model',
        'model-server',
      ];
      for (const category of categories) {
        const entity = makeEntity({
          'rhdh.io/ai-asset-category': category,
          'rhdh.io/ai-asset-version': '1.0.0',
          'rhdh.io/ai-asset-source': 'kagenti/default',
        });
        const result = await validator.validateEntityKind(entity);
        expect(result).toBe(false);
      }
    });
  });

  describe('invalid AI asset entities', () => {
    it('rejects entities with missing category', async () => {
      const entity = makeEntity({
        'rhdh.io/ai-asset-version': '1.0.0',
        'rhdh.io/ai-asset-source': 'kagenti/default',
      });
      await expect(validator.validateEntityKind(entity)).rejects.toThrow(
        'Invalid or missing rhdh.io/ai-asset-category annotation',
      );
    });

    it('rejects entities with invalid category value', async () => {
      const entity = makeEntity({
        'rhdh.io/ai-asset-category': 'invalid-type',
        'rhdh.io/ai-asset-version': '1.0.0',
        'rhdh.io/ai-asset-source': 'kagenti/default',
      });
      await expect(validator.validateEntityKind(entity)).rejects.toThrow(
        "Invalid rhdh.io/ai-asset-category value 'invalid-type'",
      );
    });

    it('rejects entities with missing version', async () => {
      const entity = makeEntity({
        'rhdh.io/ai-asset-category': 'agent',
        'rhdh.io/ai-asset-source': 'kagenti/default',
      });
      await expect(validator.validateEntityKind(entity)).rejects.toThrow(
        'Invalid or missing rhdh.io/ai-asset-version annotation',
      );
    });

    it('rejects entities with missing source', async () => {
      const entity = makeEntity({
        'rhdh.io/ai-asset-category': 'agent',
        'rhdh.io/ai-asset-version': '1.0.0',
      });
      await expect(validator.validateEntityKind(entity)).rejects.toThrow(
        'Invalid or missing rhdh.io/ai-asset-source annotation',
      );
    });
  });
});
