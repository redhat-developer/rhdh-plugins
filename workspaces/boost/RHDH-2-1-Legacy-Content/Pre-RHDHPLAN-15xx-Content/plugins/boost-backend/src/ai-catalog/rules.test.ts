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

import { isAiAssetCategory, isFromConnector, isInTenant } from './rules';
import type { AiCatalogAssetResource } from './rules';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResource(
  overrides: Partial<AiCatalogAssetResource['metadata']> = {},
): AiCatalogAssetResource {
  return {
    metadata: {
      annotations: {},
      namespace: 'default',
      ...overrides,
    },
  };
}

// ---------------------------------------------------------------------------
// isAiAssetCategory
// ---------------------------------------------------------------------------

describe('isAiAssetCategory', () => {
  describe('apply()', () => {
    it('returns true when annotation matches category', () => {
      const resource = makeResource({
        annotations: { 'rhdh.io/ai-asset-category': 'ai-model' },
      });
      expect(isAiAssetCategory.apply(resource, { category: 'ai-model' })).toBe(
        true,
      );
    });

    it('returns false when annotation does not match category', () => {
      const resource = makeResource({
        annotations: { 'rhdh.io/ai-asset-category': 'agent' },
      });
      expect(isAiAssetCategory.apply(resource, { category: 'ai-model' })).toBe(
        false,
      );
    });

    it('returns false when annotation is missing', () => {
      const resource = makeResource({ annotations: {} });
      expect(isAiAssetCategory.apply(resource, { category: 'ai-model' })).toBe(
        false,
      );
    });

    it('returns false when annotations object is undefined', () => {
      const resource = makeResource({ annotations: undefined });
      expect(isAiAssetCategory.apply(resource, { category: 'skill' })).toBe(
        false,
      );
    });

    it('matches mcp-server category', () => {
      const resource = makeResource({
        annotations: { 'rhdh.io/ai-asset-category': 'mcp-server' },
      });
      expect(
        isAiAssetCategory.apply(resource, { category: 'mcp-server' }),
      ).toBe(true);
    });

    it('matches model-server category', () => {
      const resource = makeResource({
        annotations: { 'rhdh.io/ai-asset-category': 'model-server' },
      });
      expect(
        isAiAssetCategory.apply(resource, { category: 'model-server' }),
      ).toBe(true);
    });
  });

  describe('toQuery()', () => {
    it('generates catalog query predicate for annotation filter', () => {
      const query = isAiAssetCategory.toQuery({ category: 'ai-model' });
      expect(query).toEqual({
        key: 'metadata.annotations.rhdh.io/ai-asset-category',
        values: ['ai-model'],
      });
    });

    it('generates query for agent category', () => {
      const query = isAiAssetCategory.toQuery({ category: 'agent' });
      expect(query).toEqual({
        key: 'metadata.annotations.rhdh.io/ai-asset-category',
        values: ['agent'],
      });
    });
  });
});

// ---------------------------------------------------------------------------
// isFromConnector
// ---------------------------------------------------------------------------

describe('isFromConnector', () => {
  describe('apply()', () => {
    it('returns true when annotation matches connector', () => {
      const resource = makeResource({
        annotations: { 'rhdh.io/ai-asset-source': 'watsonx' },
      });
      expect(isFromConnector.apply(resource, { connector: 'watsonx' })).toBe(
        true,
      );
    });

    it('returns false when annotation does not match connector', () => {
      const resource = makeResource({
        annotations: { 'rhdh.io/ai-asset-source': 'internal-registry' },
      });
      expect(isFromConnector.apply(resource, { connector: 'watsonx' })).toBe(
        false,
      );
    });

    it('returns false when annotation is missing', () => {
      const resource = makeResource({ annotations: {} });
      expect(isFromConnector.apply(resource, { connector: 'watsonx' })).toBe(
        false,
      );
    });

    it('returns false when annotations object is undefined', () => {
      const resource = makeResource({ annotations: undefined });
      expect(isFromConnector.apply(resource, { connector: 'watsonx' })).toBe(
        false,
      );
    });
  });

  describe('toQuery()', () => {
    it('generates catalog query predicate for annotation filter', () => {
      const query = isFromConnector.toQuery({ connector: 'watsonx' });
      expect(query).toEqual({
        key: 'metadata.annotations.rhdh.io/ai-asset-source',
        values: ['watsonx'],
      });
    });

    it('generates query for internal-registry connector', () => {
      const query = isFromConnector.toQuery({
        connector: 'internal-registry',
      });
      expect(query).toEqual({
        key: 'metadata.annotations.rhdh.io/ai-asset-source',
        values: ['internal-registry'],
      });
    });
  });
});

// ---------------------------------------------------------------------------
// isInTenant
// ---------------------------------------------------------------------------

describe('isInTenant', () => {
  describe('apply()', () => {
    it('returns true when namespace matches tenant', () => {
      const resource = makeResource({ namespace: 'team-alpha' });
      expect(isInTenant.apply(resource, { tenant: 'team-alpha' })).toBe(true);
    });

    it('returns true when tenant annotation matches', () => {
      const resource = makeResource({
        namespace: 'default',
        annotations: { 'rhdh.io/ai-asset-tenant': 'team-beta' },
      });
      expect(isInTenant.apply(resource, { tenant: 'team-beta' })).toBe(true);
    });

    it('returns false when neither namespace nor annotation matches', () => {
      const resource = makeResource({
        namespace: 'team-alpha',
        annotations: { 'rhdh.io/ai-asset-tenant': 'team-beta' },
      });
      expect(isInTenant.apply(resource, { tenant: 'team-gamma' })).toBe(false);
    });

    it('returns false when annotation is missing and namespace does not match', () => {
      const resource = makeResource({
        namespace: 'team-alpha',
        annotations: {},
      });
      expect(isInTenant.apply(resource, { tenant: 'team-beta' })).toBe(false);
    });

    it('matches default namespace when no namespace is set', () => {
      const resource = makeResource({ namespace: undefined });
      expect(isInTenant.apply(resource, { tenant: 'default' })).toBe(true);
    });

    it('prefers namespace over annotation when both match', () => {
      const resource = makeResource({
        namespace: 'team-alpha',
        annotations: { 'rhdh.io/ai-asset-tenant': 'team-alpha' },
      });
      // Both match — should return true
      expect(isInTenant.apply(resource, { tenant: 'team-alpha' })).toBe(true);
    });

    it('returns false when annotations object is undefined', () => {
      const resource = makeResource({
        namespace: 'other',
        annotations: undefined,
      });
      expect(isInTenant.apply(resource, { tenant: 'team-alpha' })).toBe(false);
    });
  });

  describe('toQuery()', () => {
    it('generates an anyOf of namespace + tenant annotation predicates', () => {
      const query = isInTenant.toQuery({ tenant: 'team-alpha' });
      expect(query).toEqual({
        anyOf: [
          { key: 'metadata.namespace', values: ['team-alpha'] },
          {
            key: 'metadata.annotations.rhdh.io/ai-asset-tenant',
            values: ['team-alpha'],
          },
        ],
      });
    });

    it('generates query for default tenant', () => {
      const query = isInTenant.toQuery({ tenant: 'default' });
      expect(query).toEqual({
        anyOf: [
          { key: 'metadata.namespace', values: ['default'] },
          {
            key: 'metadata.annotations.rhdh.io/ai-asset-tenant',
            values: ['default'],
          },
        ],
      });
    });
  });
});
