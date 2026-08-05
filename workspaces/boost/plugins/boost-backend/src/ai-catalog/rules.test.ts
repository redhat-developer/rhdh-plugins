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

// The PermissionRule type uses NoInfer<TParams> which makes direct
// calls fail type-checking when params default to `undefined`. These
// wrappers provide typed access for tests while keeping the production
// rule types unchanged.
const categoryRule = isAiAssetCategory as {
  apply(r: AiCatalogAssetResource, p: { category: string }): boolean;
  toQuery(p: { category: string }): { key: string; values: string[] };
};
const connectorRule = isFromConnector as {
  apply(r: AiCatalogAssetResource, p: { connector: string }): boolean;
  toQuery(p: { connector: string }): { key: string; values: string[] };
};
const tenantRule = isInTenant as {
  apply(r: AiCatalogAssetResource, p: { tenant: string }): boolean;
  toQuery(p: { tenant: string }): { key: string; values: string[] };
};

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
      expect(categoryRule.apply(resource, { category: 'ai-model' })).toBe(true);
    });

    it('returns false when annotation does not match category', () => {
      const resource = makeResource({
        annotations: { 'rhdh.io/ai-asset-category': 'agent' },
      });
      expect(categoryRule.apply(resource, { category: 'ai-model' })).toBe(
        false,
      );
    });

    it('returns false when annotation is missing', () => {
      const resource = makeResource({ annotations: {} });
      expect(categoryRule.apply(resource, { category: 'ai-model' })).toBe(
        false,
      );
    });

    it('returns false when annotations object is undefined', () => {
      const resource = makeResource({ annotations: undefined });
      expect(categoryRule.apply(resource, { category: 'skill' })).toBe(false);
    });

    it('matches mcp-server category', () => {
      const resource = makeResource({
        annotations: { 'rhdh.io/ai-asset-category': 'mcp-server' },
      });
      expect(categoryRule.apply(resource, { category: 'mcp-server' })).toBe(
        true,
      );
    });

    it('matches model-server category', () => {
      const resource = makeResource({
        annotations: { 'rhdh.io/ai-asset-category': 'model-server' },
      });
      expect(categoryRule.apply(resource, { category: 'model-server' })).toBe(
        true,
      );
    });
  });

  describe('toQuery()', () => {
    it('generates catalog query predicate for annotation filter', () => {
      const query = categoryRule.toQuery({ category: 'ai-model' });
      expect(query).toEqual({
        key: 'rhdh.io/ai-asset-category',
        values: ['ai-model'],
      });
    });

    it('generates query for agent category', () => {
      const query = categoryRule.toQuery({ category: 'agent' });
      expect(query).toEqual({
        key: 'rhdh.io/ai-asset-category',
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
      expect(connectorRule.apply(resource, { connector: 'watsonx' })).toBe(
        true,
      );
    });

    it('returns false when annotation does not match connector', () => {
      const resource = makeResource({
        annotations: { 'rhdh.io/ai-asset-source': 'internal-registry' },
      });
      expect(connectorRule.apply(resource, { connector: 'watsonx' })).toBe(
        false,
      );
    });

    it('returns false when annotation is missing', () => {
      const resource = makeResource({ annotations: {} });
      expect(connectorRule.apply(resource, { connector: 'watsonx' })).toBe(
        false,
      );
    });

    it('returns false when annotations object is undefined', () => {
      const resource = makeResource({ annotations: undefined });
      expect(connectorRule.apply(resource, { connector: 'watsonx' })).toBe(
        false,
      );
    });
  });

  describe('toQuery()', () => {
    it('generates catalog query predicate for annotation filter', () => {
      const query = connectorRule.toQuery({ connector: 'watsonx' });
      expect(query).toEqual({
        key: 'rhdh.io/ai-asset-source',
        values: ['watsonx'],
      });
    });

    it('generates query for internal-registry connector', () => {
      const query = connectorRule.toQuery({
        connector: 'internal-registry',
      });
      expect(query).toEqual({
        key: 'rhdh.io/ai-asset-source',
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
      expect(tenantRule.apply(resource, { tenant: 'team-alpha' })).toBe(true);
    });

    it('returns true when tenant annotation matches', () => {
      const resource = makeResource({
        namespace: 'default',
        annotations: { 'rhdh.io/ai-asset-tenant': 'team-beta' },
      });
      expect(tenantRule.apply(resource, { tenant: 'team-beta' })).toBe(true);
    });

    it('returns false when neither namespace nor annotation matches', () => {
      const resource = makeResource({
        namespace: 'team-alpha',
        annotations: { 'rhdh.io/ai-asset-tenant': 'team-beta' },
      });
      expect(tenantRule.apply(resource, { tenant: 'team-gamma' })).toBe(false);
    });

    it('returns false when annotation is missing and namespace does not match', () => {
      const resource = makeResource({
        namespace: 'team-alpha',
        annotations: {},
      });
      expect(tenantRule.apply(resource, { tenant: 'team-beta' })).toBe(false);
    });

    it('matches default namespace when no namespace is set', () => {
      const resource = makeResource({ namespace: undefined });
      expect(tenantRule.apply(resource, { tenant: 'default' })).toBe(true);
    });

    it('prefers namespace over annotation when both match', () => {
      const resource = makeResource({
        namespace: 'team-alpha',
        annotations: { 'rhdh.io/ai-asset-tenant': 'team-alpha' },
      });
      // Both match — should return true
      expect(tenantRule.apply(resource, { tenant: 'team-alpha' })).toBe(true);
    });

    it('returns false when annotations object is undefined', () => {
      const resource = makeResource({
        namespace: 'other',
        annotations: undefined,
      });
      expect(tenantRule.apply(resource, { tenant: 'team-alpha' })).toBe(false);
    });
  });

  describe('toQuery()', () => {
    it('generates catalog query predicate for tenant filter', () => {
      const query = tenantRule.toQuery({ tenant: 'team-alpha' });
      expect(query).toEqual({
        key: 'rhdh.io/ai-asset-tenant',
        values: ['team-alpha'],
      });
    });

    it('generates query for default tenant', () => {
      const query = tenantRule.toQuery({ tenant: 'default' });
      expect(query).toEqual({
        key: 'rhdh.io/ai-asset-tenant',
        values: ['default'],
      });
    });
  });
});
