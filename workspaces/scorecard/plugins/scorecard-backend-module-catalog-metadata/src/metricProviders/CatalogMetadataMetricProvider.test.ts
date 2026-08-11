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

import { ConfigReader } from '@backstage/config';
import type { Entity } from '@backstage/catalog-model';
import {
  mergeStatusMappings,
  DEFAULT_STATUS_MAPPING,
} from './CatalogMetadataConfig';
import {
  createCatalogMetadataMetricProvider,
  resolveFieldPath,
  evaluateFieldStatus,
  entityMatchesFilter,
} from './CatalogMetadataMetricProvider';

// ── helpers ────────────────────────────────────────────────────────────

function buildConfig(checks: object[], optionsStatusMapping?: object) {
  return {
    scorecard: {
      metricProviders: {
        catalogMetadata: {
          requiredAttributes: {
            options: {
              checks,
              ...(optionsStatusMapping
                ? { statusMapping: optionsStatusMapping }
                : {}),
            },
          },
        },
      },
    },
  };
}

function titleCheck(overrides?: object) {
  return {
    metric: {
      id: 'title',
      title: 'Title is required',
      description: 'The metadata.title should be defined.',
    },
    filter: { kind: 'Component' },
    field: 'metadata.title',
    ...overrides,
  };
}

function lifecycleCheck(overrides?: object) {
  return {
    metric: {
      id: 'lifecycle',
      title: 'lifecycle should be prod, stage, test or dev',
      description:
        'The spec.lifecycle field should be one of four accepted values.',
    },
    filter: { kind: 'Component' },
    field: 'spec.lifecycle',
    statusMapping: {
      exists: 'invalid',
      values: {
        prod: 'ok',
        stage: 'ok',
        test: 'ok',
        dev: 'ok',
      },
    },
    ...overrides,
  };
}

const componentEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'test-component',
    title: 'My Component',
    tags: ['typescript', 'backstage'],
    annotations: {
      'backstage.io/source-location':
        'url:https://github.com/org/my-repo/tree/main/',
    },
    links: [{ url: 'https://example.com', title: 'Homepage' }],
  },
  spec: {
    type: 'service',
    lifecycle: 'prod',
    owner: 'team-a',
  },
};

const templateEntity: Entity = {
  apiVersion: 'scaffolder.backstage.io/v1beta3',
  kind: 'Template',
  metadata: {
    name: 'test-template',
  },
  spec: {
    type: 'service',
    owner: 'team-b',
  },
};

// ── resolveFieldPath ───────────────────────────────────────────────────

describe('resolveFieldPath', () => {
  const entity = componentEntity;

  it('should resolve a top-level field', () => {
    expect(resolveFieldPath(entity, 'kind')).toBe('Component');
  });

  it('should resolve a nested field', () => {
    expect(resolveFieldPath(entity, 'metadata.name')).toBe('test-component');
  });

  it('should resolve a deeply nested field', () => {
    expect(resolveFieldPath(entity, 'spec.lifecycle')).toBe('prod');
  });

  it('should return NOT_FOUND for a missing top-level field', () => {
    const result = resolveFieldPath(entity, 'nonexistent');
    expect(typeof result).toBe('symbol');
  });

  it('should return NOT_FOUND for a missing nested field', () => {
    const result = resolveFieldPath(entity, 'metadata.nonexistent');
    expect(typeof result).toBe('symbol');
  });

  it('should return NOT_FOUND when traversing through a non-object', () => {
    const result = resolveFieldPath(entity, 'metadata.name.something');
    expect(typeof result).toBe('symbol');
  });

  it('should return NOT_FOUND for dotted annotation keys', () => {
    // Dotted annotation keys like "backstage.io/source-location" require
    // special handling. The path splits on "." so it tries
    // entity.metadata.annotations.backstage which does not exist.
    // This is expected behavior — callers should use a non-dotted
    // annotation key or a custom resolution strategy.
    const result = resolveFieldPath(
      entity,
      'metadata.annotations.backstage.io/source-location',
    );
    expect(typeof result).toBe('symbol');
  });

  it('should resolve array fields', () => {
    expect(resolveFieldPath(entity, 'metadata.tags')).toEqual([
      'typescript',
      'backstage',
    ]);
  });
});

// ── evaluateFieldStatus ────────────────────────────────────────────────

describe('evaluateFieldStatus', () => {
  it('should return "found" for an existing non-empty value', () => {
    const status = evaluateFieldStatus(
      componentEntity,
      'metadata.title',
      DEFAULT_STATUS_MAPPING,
    );
    expect(status).toBe('found');
  });

  it('should return "missed" for a missing field', () => {
    const status = evaluateFieldStatus(
      templateEntity,
      'metadata.title',
      DEFAULT_STATUS_MAPPING,
    );
    expect(status).toBe('missed');
  });

  it('should return "missed" for a null field', () => {
    const entity: Entity = {
      ...componentEntity,
      metadata: {
        ...componentEntity.metadata,
        title: null as unknown as string,
      },
    };
    const status = evaluateFieldStatus(
      entity,
      'metadata.title',
      DEFAULT_STATUS_MAPPING,
    );
    expect(status).toBe('missed');
  });

  it('should return "missed" for an empty string field', () => {
    const entity: Entity = {
      ...componentEntity,
      metadata: { ...componentEntity.metadata, title: '' },
    };
    const status = evaluateFieldStatus(
      entity,
      'metadata.title',
      DEFAULT_STATUS_MAPPING,
    );
    expect(status).toBe('missed');
  });

  it('should return "missed" for an empty array field', () => {
    const entity: Entity = {
      ...componentEntity,
      metadata: { ...componentEntity.metadata, tags: [] },
    };
    const status = evaluateFieldStatus(
      entity,
      'metadata.tags',
      DEFAULT_STATUS_MAPPING,
    );
    expect(status).toBe('missed');
  });

  it('should return matched value status for a known value', () => {
    const statusMapping = {
      ...DEFAULT_STATUS_MAPPING,
      exists: 'invalid',
      values: { prod: 'ok', stage: 'ok', test: 'ok', dev: 'ok' },
    };
    const status = evaluateFieldStatus(
      componentEntity,
      'spec.lifecycle',
      statusMapping,
    );
    expect(status).toBe('ok');
  });

  it('should return "exists" status for an unknown value', () => {
    const entity: Entity = {
      ...componentEntity,
      spec: { ...componentEntity.spec, lifecycle: 'experimental' },
    };
    const statusMapping = {
      ...DEFAULT_STATUS_MAPPING,
      exists: 'invalid',
      values: { prod: 'ok', stage: 'ok' },
    };
    const status = evaluateFieldStatus(entity, 'spec.lifecycle', statusMapping);
    expect(status).toBe('invalid');
  });

  it('should return "missed" for a missing field with values mapping', () => {
    const statusMapping = {
      ...DEFAULT_STATUS_MAPPING,
      exists: 'invalid',
      values: { prod: 'ok' },
    };
    const status = evaluateFieldStatus(
      templateEntity,
      'spec.lifecycle',
      statusMapping,
    );
    expect(status).toBe('missed');
  });

  it('should handle non-empty arrays as "exists"', () => {
    const status = evaluateFieldStatus(
      componentEntity,
      'metadata.tags',
      DEFAULT_STATUS_MAPPING,
    );
    expect(status).toBe('found');
  });
});

// ── entityMatchesFilter ────────────────────────────────────────────────

describe('entityMatchesFilter', () => {
  it('should match with an empty filter', () => {
    expect(entityMatchesFilter(componentEntity, {})).toBe(true);
  });

  it('should match on kind (case-insensitive)', () => {
    expect(entityMatchesFilter(componentEntity, { kind: 'Component' })).toBe(
      true,
    );
    expect(entityMatchesFilter(componentEntity, { kind: 'component' })).toBe(
      true,
    );
  });

  it('should not match on wrong kind', () => {
    expect(entityMatchesFilter(componentEntity, { kind: 'Template' })).toBe(
      false,
    );
  });

  it('should match on multiple filter fields', () => {
    expect(
      entityMatchesFilter(componentEntity, {
        kind: 'Component',
        'spec.type': 'service',
      }),
    ).toBe(true);
  });

  it('should not match when one filter field does not match', () => {
    expect(
      entityMatchesFilter(componentEntity, {
        kind: 'Component',
        'spec.type': 'website',
      }),
    ).toBe(false);
  });

  it('should not match when filter field path does not resolve', () => {
    expect(
      entityMatchesFilter(componentEntity, {
        'spec.nonexistent': 'value',
      }),
    ).toBe(false);
  });
});

// ── mergeStatusMappings ────────────────────────────────────────────────

describe('mergeStatusMappings', () => {
  it('should return defaults when no overrides', () => {
    const result = mergeStatusMappings(undefined, undefined);
    expect(result).toEqual(DEFAULT_STATUS_MAPPING);
  });

  it('should apply options-level overrides', () => {
    const result = mergeStatusMappings(undefined, {
      exists: 'present',
    });
    expect(result.exists).toBe('present');
    expect(result.missed).toBe('missed');
  });

  it('should apply check-level overrides over options-level', () => {
    const result = mergeStatusMappings(
      { exists: 'check-level' },
      { exists: 'options-level' },
    );
    expect(result.exists).toBe('check-level');
  });

  it('should merge values maps with check > options > defaults', () => {
    const result = mergeStatusMappings(
      { values: { prod: 'check-prod' } },
      { values: { prod: 'options-prod', stage: 'options-stage' } },
    );
    expect(result.values).toEqual({
      prod: 'check-prod',
      stage: 'options-stage',
    });
  });

  it('should fall back to defaults for unset fields', () => {
    const result = mergeStatusMappings({ exists: 'custom' }, undefined);
    expect(result.exists).toBe('custom');
    expect(result.empty).toBe('missed');
    expect(result.emptyString).toBe('missed');
    expect(result.emptyArray).toBe('missed');
    expect(result.missed).toBe('missed');
  });
});

// ── createCatalogMetadataMetricProvider ────────────────────────────────

describe('createCatalogMetadataMetricProvider', () => {
  it('should return undefined when no config is provided', () => {
    const provider = createCatalogMetadataMetricProvider(new ConfigReader({}));
    expect(provider).toBeUndefined();
  });

  it('should return undefined when checks array is empty', () => {
    const provider = createCatalogMetadataMetricProvider(
      new ConfigReader(buildConfig([])),
    );
    expect(provider).toBeUndefined();
  });

  it('should create provider with a single check', () => {
    const config = new ConfigReader(buildConfig([titleCheck()]));
    const provider = createCatalogMetadataMetricProvider(config);

    expect(provider).toBeDefined();
    expect(provider?.getMetrics().map(m => m.id)).toEqual([
      'catalogMetadata.title',
    ]);
  });

  it('should create provider with multiple checks', () => {
    const config = new ConfigReader(
      buildConfig([titleCheck(), lifecycleCheck()]),
    );
    const provider = createCatalogMetadataMetricProvider(config);

    expect(provider).toBeDefined();
    expect(provider?.getMetrics().map(m => m.id)).toEqual([
      'catalogMetadata.title',
      'catalogMetadata.lifecycle',
    ]);
  });
});

// ── provider methods ───────────────────────────────────────────────────

describe('CatalogMetadataMetricProvider', () => {
  describe('provider identification', () => {
    const provider = createCatalogMetadataMetricProvider(
      new ConfigReader(buildConfig([titleCheck()])),
    );

    it('should return correct provider ID', () => {
      expect(provider?.getProviderId()).toBe(
        'catalogMetadata.requiredAttributes',
      );
    });

    it('should return correct datasource ID', () => {
      expect(provider?.getProviderDatasourceId()).toBe('catalogMetadata');
    });
  });

  describe('getMetrics', () => {
    it('should return metrics with correct type', () => {
      const provider = createCatalogMetadataMetricProvider(
        new ConfigReader(buildConfig([titleCheck()])),
      );
      const metrics = provider?.getMetrics();

      expect(metrics).toHaveLength(1);
      metrics?.forEach(m => {
        expect(m.type).toBe('number');
      });
    });

    it('should generate threshold rules from status mapping', () => {
      const provider = createCatalogMetadataMetricProvider(
        new ConfigReader(buildConfig([titleCheck()])),
      );
      const metrics = provider?.getMetrics();

      // Default status mapping produces 'found' and 'missed' statuses
      const thresholds = metrics?.[0].thresholds;
      expect(thresholds?.rules).toBeDefined();
      const keys = thresholds?.rules.map(r => r.key);
      expect(keys).toContain('found');
      expect(keys).toContain('missed');
    });

    it('should generate threshold rules for value-specific mapping', () => {
      const provider = createCatalogMetadataMetricProvider(
        new ConfigReader(buildConfig([lifecycleCheck()])),
      );
      const metrics = provider?.getMetrics();

      const thresholds = metrics?.[0].thresholds;
      const keys = thresholds?.rules.map(r => r.key);
      expect(keys).toContain('ok');
      expect(keys).toContain('invalid');
      expect(keys).toContain('missed');
    });

    it('should include metric metadata', () => {
      const provider = createCatalogMetadataMetricProvider(
        new ConfigReader(buildConfig([titleCheck()])),
      );
      const metric = provider?.getMetrics()[0];

      expect(metric?.id).toBe('catalogMetadata.title');
      expect(metric?.title).toBe('Title is required');
      expect(metric?.description).toBe('The metadata.title should be defined.');
    });
  });

  describe('getCatalogFilter', () => {
    it('should return kind filter when all checks share the same kind', () => {
      const provider = createCatalogMetadataMetricProvider(
        new ConfigReader(
          buildConfig([
            titleCheck({ filter: { kind: 'Component' } }),
            lifecycleCheck({ filter: { kind: 'Component' } }),
          ]),
        ),
      );
      expect(provider?.getCatalogFilter()).toEqual({
        kind: 'component',
      });
    });

    it('should return multi-kind filter for different kinds', () => {
      const provider = createCatalogMetadataMetricProvider(
        new ConfigReader(
          buildConfig([
            titleCheck({ filter: { kind: 'Component' } }),
            titleCheck({
              metric: {
                id: 'templateOwner',
                title: 'Owner',
                description: 'desc',
              },
              filter: { kind: 'Template' },
              field: 'spec.owner',
            }),
          ]),
        ),
      );
      const catalogFilter = provider?.getCatalogFilter();
      expect(catalogFilter?.kind).toBeDefined();
      expect(
        Array.isArray(catalogFilter?.kind)
          ? (catalogFilter?.kind as string[]).sort()
          : [],
      ).toEqual(['component', 'template']);
    });

    it('should return empty filter when any check has no kind filter', () => {
      const provider = createCatalogMetadataMetricProvider(
        new ConfigReader(
          buildConfig([
            titleCheck({ filter: { kind: 'Component' } }),
            titleCheck({
              metric: { id: 'allTitle', title: 'T', description: 'D' },
              filter: {},
              field: 'metadata.title',
            }),
          ]),
        ),
      );
      expect(provider?.getCatalogFilter()).toEqual({});
    });
  });

  describe('calculateMetrics', () => {
    it('should return "found" status code for existing field', async () => {
      const provider = createCatalogMetadataMetricProvider(
        new ConfigReader(buildConfig([titleCheck()])),
      );
      const result = await provider?.calculateMetrics(componentEntity);

      // The metric value is a numeric code mapping to "found"
      const metrics = provider?.getMetrics();
      const titleMetric = metrics?.find(m => m.id === 'catalogMetadata.title');
      const foundRule = titleMetric?.thresholds.rules.find(
        r => r.key === 'found',
      );
      const expectedCode = Number(foundRule?.expression.replace('==', ''));

      expect(result?.get('catalogMetadata.title')).toBe(expectedCode);
    });

    it('should return "missed" status code for missing field', async () => {
      const entityWithoutTitle: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'no-title-component' },
        spec: { type: 'service', lifecycle: 'prod', owner: 'team-a' },
      };
      const provider = createCatalogMetadataMetricProvider(
        new ConfigReader(buildConfig([titleCheck()])),
      );
      const result = await provider?.calculateMetrics(entityWithoutTitle);

      const metrics = provider?.getMetrics();
      const titleMetric = metrics?.find(m => m.id === 'catalogMetadata.title');
      const missedRule = titleMetric?.thresholds.rules.find(
        r => r.key === 'missed',
      );
      const expectedCode = Number(missedRule?.expression.replace('==', ''));

      expect(result?.get('catalogMetadata.title')).toBe(expectedCode);
    });

    it('should skip checks for non-matching entities', async () => {
      const provider = createCatalogMetadataMetricProvider(
        new ConfigReader(
          buildConfig([titleCheck({ filter: { kind: 'Component' } })]),
        ),
      );
      const result = await provider?.calculateMetrics(templateEntity);

      expect(result?.has('catalogMetadata.title')).toBe(false);
    });

    it('should return "ok" for valid lifecycle value', async () => {
      const provider = createCatalogMetadataMetricProvider(
        new ConfigReader(buildConfig([lifecycleCheck()])),
      );
      const result = await provider?.calculateMetrics(componentEntity);

      const metrics = provider?.getMetrics();
      const lcMetric = metrics?.find(m => m.id === 'catalogMetadata.lifecycle');
      const okRule = lcMetric?.thresholds.rules.find(r => r.key === 'ok');
      const expectedCode = Number(okRule?.expression.replace('==', ''));

      expect(result?.get('catalogMetadata.lifecycle')).toBe(expectedCode);
    });

    it('should return "invalid" for unknown lifecycle value', async () => {
      const entity: Entity = {
        ...componentEntity,
        spec: { ...componentEntity.spec, lifecycle: 'experimental' },
      };
      const provider = createCatalogMetadataMetricProvider(
        new ConfigReader(buildConfig([lifecycleCheck()])),
      );
      const result = await provider?.calculateMetrics(entity);

      const metrics = provider?.getMetrics();
      const lcMetric = metrics?.find(m => m.id === 'catalogMetadata.lifecycle');
      const invalidRule = lcMetric?.thresholds.rules.find(
        r => r.key === 'invalid',
      );
      const expectedCode = Number(invalidRule?.expression.replace('==', ''));

      expect(result?.get('catalogMetadata.lifecycle')).toBe(expectedCode);
    });

    it('should return "missed" for missing lifecycle value', async () => {
      const entity: Entity = {
        ...componentEntity,
        spec: { type: 'service', owner: 'team-a' },
      };
      const provider = createCatalogMetadataMetricProvider(
        new ConfigReader(buildConfig([lifecycleCheck()])),
      );
      const result = await provider?.calculateMetrics(entity);

      const metrics = provider?.getMetrics();
      const lcMetric = metrics?.find(m => m.id === 'catalogMetadata.lifecycle');
      const missedRule = lcMetric?.thresholds.rules.find(
        r => r.key === 'missed',
      );
      const expectedCode = Number(missedRule?.expression.replace('==', ''));

      expect(result?.get('catalogMetadata.lifecycle')).toBe(expectedCode);
    });

    it('should handle empty string field with default mapping', async () => {
      const entity: Entity = {
        ...componentEntity,
        metadata: { ...componentEntity.metadata, title: '' },
      };
      const provider = createCatalogMetadataMetricProvider(
        new ConfigReader(buildConfig([titleCheck()])),
      );
      const result = await provider?.calculateMetrics(entity);

      // Default mapping: emptyString → 'missed'
      const metrics = provider?.getMetrics();
      const titleMetric = metrics?.find(m => m.id === 'catalogMetadata.title');
      const missedRule = titleMetric?.thresholds.rules.find(
        r => r.key === 'missed',
      );
      const expectedCode = Number(missedRule?.expression.replace('==', ''));

      expect(result?.get('catalogMetadata.title')).toBe(expectedCode);
    });

    it('should handle empty array field with default mapping', async () => {
      const entity: Entity = {
        ...componentEntity,
        metadata: { ...componentEntity.metadata, tags: [] },
      };
      const provider = createCatalogMetadataMetricProvider(
        new ConfigReader(
          buildConfig([
            titleCheck({
              metric: {
                id: 'tags',
                title: 'Tags',
                description: 'Tags should exist',
              },
              field: 'metadata.tags',
            }),
          ]),
        ),
      );
      const result = await provider?.calculateMetrics(entity);

      const metrics = provider?.getMetrics();
      const tagsMetric = metrics?.find(m => m.id === 'catalogMetadata.tags');
      const missedRule = tagsMetric?.thresholds.rules.find(
        r => r.key === 'missed',
      );
      const expectedCode = Number(missedRule?.expression.replace('==', ''));

      expect(result?.get('catalogMetadata.tags')).toBe(expectedCode);
    });

    it('should handle multiple checks on the same entity', async () => {
      const provider = createCatalogMetadataMetricProvider(
        new ConfigReader(buildConfig([titleCheck(), lifecycleCheck()])),
      );
      const result = await provider?.calculateMetrics(componentEntity);

      expect(result?.has('catalogMetadata.title')).toBe(true);
      expect(result?.has('catalogMetadata.lifecycle')).toBe(true);
    });

    it('should apply options-level status mapping to all checks', async () => {
      const config = new ConfigReader(
        buildConfig([titleCheck()], {
          exists: 'present',
          missed: 'absent',
          emptyString: 'absent',
          emptyArray: 'absent',
          empty: 'absent',
        }),
      );
      const provider = createCatalogMetadataMetricProvider(config);
      const metrics = provider?.getMetrics();

      const titleMetric = metrics?.find(m => m.id === 'catalogMetadata.title');
      const keys = titleMetric?.thresholds.rules.map(r => r.key);
      expect(keys).toContain('present');
      expect(keys).toContain('absent');
    });

    it('should override options-level mapping with check-level mapping', async () => {
      const config = new ConfigReader(
        buildConfig(
          [
            titleCheck({
              statusMapping: {
                exists: 'check-present',
              },
            }),
          ],
          {
            exists: 'options-present',
          },
        ),
      );
      const provider = createCatalogMetadataMetricProvider(config);
      const metrics = provider?.getMetrics();

      const titleMetric = metrics?.find(m => m.id === 'catalogMetadata.title');
      const keys = titleMetric?.thresholds.rules.map(r => r.key);
      expect(keys).toContain('check-present');
      expect(keys).not.toContain('options-present');
    });

    it('should apply check filter with empty filter matching all entities', async () => {
      const provider = createCatalogMetadataMetricProvider(
        new ConfigReader(buildConfig([titleCheck({ filter: {} })])),
      );

      const componentResult = await provider?.calculateMetrics(componentEntity);
      expect(componentResult?.has('catalogMetadata.title')).toBe(true);

      const templateResult = await provider?.calculateMetrics(templateEntity);
      expect(templateResult?.has('catalogMetadata.title')).toBe(true);
    });
  });
});
