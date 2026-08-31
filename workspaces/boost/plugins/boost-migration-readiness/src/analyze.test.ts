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

import type { CatalogEntity } from './types';
import { analyzeEntities } from './analyze';

function makeEntity(
  overrides: Partial<CatalogEntity> & { kind: string },
): CatalogEntity {
  return {
    kind: overrides.kind,
    metadata: {
      name: overrides.metadata?.name ?? 'test-entity',
      namespace: overrides.metadata?.namespace,
      annotations: overrides.metadata?.annotations,
    },
    spec: overrides.spec,
  };
}

describe('analyzeEntities', () => {
  it('excludes entities without ai-asset-category annotation', () => {
    const entities = [
      makeEntity({ kind: 'Component', metadata: { name: 'plain-component' } }),
    ];
    const report = analyzeEntities(entities);
    expect(report.entities).toHaveLength(0);
  });

  it('assesses an MCP server entity with high confidence', () => {
    const entities = [
      makeEntity({
        kind: 'API',
        metadata: {
          name: 'my-mcp-server',
          annotations: {
            'rhdh.io/ai-asset-category': 'mcp-server',
            'rhdh.io/ai-asset-version': '1.0.0',
            'rhdh.io/ai-asset-source': 'mcp-registry',
          },
        },
        spec: { type: 'mcp-server' },
      }),
    ];

    const report = analyzeEntities(entities);
    expect(report.entities).toHaveLength(1);

    const assessment = report.entities[0];
    expect(assessment.name).toBe('my-mcp-server');
    expect(assessment.confidence).toBe('high');
    expect(assessment.targetKind).toBe('API');
    expect(assessment.targetModel).toBe('McpServerApiEntity');
    expect(assessment.alreadyAligned).toBe(true);
    expect(assessment.warnings).toHaveLength(0);
  });

  it('assesses a skill entity with medium-high confidence', () => {
    const entities = [
      makeEntity({
        kind: 'AIResource',
        metadata: {
          name: 'my-skill',
          annotations: {
            'rhdh.io/ai-asset-category': 'skill',
            'rhdh.io/ai-asset-version': '2.0.0',
            'rhdh.io/ai-asset-source': 'kagenti',
          },
        },
        spec: { type: 'skill' },
      }),
    ];

    const report = analyzeEntities(entities);
    expect(report.entities).toHaveLength(1);

    const assessment = report.entities[0];
    expect(assessment.confidence).toBe('medium-high');
    expect(assessment.targetKind).toBe('AiResource');
    expect(assessment.alreadyAligned).toBe(false); // AIResource != AiResource (casing)
  });

  it('assesses a rule entity', () => {
    const entities = [
      makeEntity({
        kind: 'AIResource',
        metadata: {
          name: 'my-rule',
          annotations: {
            'rhdh.io/ai-asset-category': 'rule',
            'rhdh.io/ai-asset-version': '1.0.0',
            'rhdh.io/ai-asset-source': 'kagenti',
          },
        },
        spec: { type: 'rule' },
      }),
    ];

    const report = analyzeEntities(entities);
    expect(report.entities).toHaveLength(1);
    expect(report.entities[0].confidence).toBe('medium-high');
  });

  it('assesses a model-server entity with medium-low confidence', () => {
    const entities = [
      makeEntity({
        kind: 'Resource',
        metadata: {
          name: 'my-model-server',
          annotations: {
            'rhdh.io/ai-asset-category': 'model-server',
            'rhdh.io/ai-asset-version': '1.0.0',
            'rhdh.io/ai-asset-source': 'rhoai',
          },
        },
        spec: { type: 'ai-model-server' },
      }),
    ];

    const report = analyzeEntities(entities);
    expect(report.entities).toHaveLength(1);
    expect(report.entities[0].confidence).toBe('medium-low');
  });

  it('assesses an ai-model entity with low confidence', () => {
    const entities = [
      makeEntity({
        kind: 'Resource',
        metadata: {
          name: 'my-model',
          annotations: {
            'rhdh.io/ai-asset-category': 'ai-model',
            'rhdh.io/ai-asset-version': '3.0.0',
            'rhdh.io/ai-asset-source': 'rhoai',
          },
        },
        spec: { type: 'ai-model' },
      }),
    ];

    const report = analyzeEntities(entities);
    expect(report.entities).toHaveLength(1);
    expect(report.entities[0].confidence).toBe('low');
    expect(report.entities[0].targetKind).toBeUndefined();
  });

  it('assesses a skill-bundle entity with low confidence', () => {
    const entities = [
      makeEntity({
        kind: 'AIResource',
        metadata: {
          name: 'security-toolkit',
          annotations: {
            'rhdh.io/ai-asset-category': 'skill-bundle',
            'rhdh.io/ai-asset-version': '1.0.0',
            'rhdh.io/ai-asset-source': 'oci',
          },
        },
        spec: { type: 'ai-skill-bundle' },
      }),
    ];

    const report = analyzeEntities(entities);
    expect(report.entities).toHaveLength(1);
    expect(report.entities[0].confidence).toBe('low');
  });

  it('assesses an agent entity with low confidence', () => {
    const entities = [
      makeEntity({
        kind: 'Component',
        metadata: {
          name: 'my-agent',
          annotations: {
            'rhdh.io/ai-asset-category': 'agent',
            'rhdh.io/ai-asset-version': '1.0.0',
            'rhdh.io/ai-asset-source': 'kagenti',
          },
        },
        spec: { type: 'ai-agent' },
      }),
    ];

    const report = analyzeEntities(entities);
    expect(report.entities).toHaveLength(1);
    expect(report.entities[0].confidence).toBe('low');
    expect(report.entities[0].targetKind).toBeUndefined();
  });

  it('warns on partial annotations — missing version', () => {
    const entities = [
      makeEntity({
        kind: 'API',
        metadata: {
          name: 'partial-entity',
          annotations: {
            'rhdh.io/ai-asset-category': 'mcp-server',
            'rhdh.io/ai-asset-source': 'mcp-registry',
          },
        },
        spec: { type: 'mcp-server' },
      }),
    ];

    const report = analyzeEntities(entities);
    expect(report.entities).toHaveLength(1);
    expect(report.entities[0].warnings).toContainEqual(
      expect.stringContaining('missing rhdh.io/ai-asset-version'),
    );
  });

  it('warns on partial annotations — missing source', () => {
    const entities = [
      makeEntity({
        kind: 'API',
        metadata: {
          name: 'partial-entity',
          annotations: {
            'rhdh.io/ai-asset-category': 'mcp-server',
            'rhdh.io/ai-asset-version': '1.0.0',
          },
        },
        spec: { type: 'mcp-server' },
      }),
    ];

    const report = analyzeEntities(entities);
    expect(report.entities).toHaveLength(1);
    expect(report.entities[0].warnings).toContainEqual(
      expect.stringContaining('missing rhdh.io/ai-asset-source'),
    );
  });

  it('warns on kind/type mismatch', () => {
    const entities = [
      makeEntity({
        kind: 'Resource',
        metadata: {
          name: 'mismatched',
          annotations: {
            'rhdh.io/ai-asset-category': 'mcp-server',
            'rhdh.io/ai-asset-version': '1.0.0',
            'rhdh.io/ai-asset-source': 'mcp-registry',
          },
        },
        spec: { type: 'mcp-server' },
      }),
    ];

    const report = analyzeEntities(entities);
    expect(report.entities).toHaveLength(1);
    expect(report.entities[0].warnings).toContainEqual(
      expect.stringContaining('Kind/type mismatch'),
    );
  });

  it('does not warn of a kind/type mismatch when already aligned', () => {
    // A model-server entity already migrated to the upstream target kind
    // (API) while keeping its current spec.type would otherwise trigger
    // both alreadyAligned=true and a contradictory mismatch warning, since
    // its kind ('API') differs from the pre-migration mapping.currentKind
    // ('Resource').
    const entities = [
      makeEntity({
        kind: 'API',
        metadata: {
          name: 'already-migrated-model-server',
          annotations: {
            'rhdh.io/ai-asset-category': 'model-server',
            'rhdh.io/ai-asset-version': '1.0.0',
            'rhdh.io/ai-asset-source': 'rhoai',
          },
        },
        spec: { type: 'ai-model-server' },
      }),
    ];

    const report = analyzeEntities(entities);
    expect(report.entities).toHaveLength(1);
    expect(report.entities[0].alreadyAligned).toBe(true);
    expect(report.entities[0].warnings).not.toContainEqual(
      expect.stringContaining('Kind/type mismatch'),
    );
  });

  it('handles entities with unrecognized category values', () => {
    const entities = [
      makeEntity({
        kind: 'Component',
        metadata: {
          name: 'unknown-category',
          annotations: {
            'rhdh.io/ai-asset-category': 'unknown-thing',
          },
        },
      }),
    ];

    const report = analyzeEntities(entities);
    expect(report.entities).toHaveLength(1);
    expect(report.entities[0].warnings).toContainEqual(
      expect.stringContaining('Unrecognized'),
    );
    expect(report.entities[0].confidence).toBe('low');
  });

  it('builds correct entityRef', () => {
    const entities = [
      makeEntity({
        kind: 'API',
        metadata: {
          name: 'my-mcp',
          namespace: 'production',
          annotations: {
            'rhdh.io/ai-asset-category': 'mcp-server',
            'rhdh.io/ai-asset-version': '1.0.0',
            'rhdh.io/ai-asset-source': 'mcp-registry',
          },
        },
        spec: { type: 'mcp-server' },
      }),
    ];

    const report = analyzeEntities(entities);
    expect(report.entities[0].entityRef).toBe('api:production/my-mcp');
  });

  it('uses default namespace when not specified', () => {
    const entities = [
      makeEntity({
        kind: 'API',
        metadata: {
          name: 'my-mcp',
          annotations: {
            'rhdh.io/ai-asset-category': 'mcp-server',
            'rhdh.io/ai-asset-version': '1.0.0',
            'rhdh.io/ai-asset-source': 'mcp-registry',
          },
        },
        spec: { type: 'mcp-server' },
      }),
    ];

    const report = analyzeEntities(entities);
    expect(report.entities[0].entityRef).toBe('api:default/my-mcp');
  });

  it('processes all seven categories in a mixed list', () => {
    const categories = [
      { kind: 'Component', cat: 'agent', type: 'ai-agent' },
      { kind: 'AIResource', cat: 'skill', type: 'skill' },
      { kind: 'AIResource', cat: 'rule', type: 'rule' },
      { kind: 'AIResource', cat: 'skill-bundle', type: 'ai-skill-bundle' },
      { kind: 'API', cat: 'mcp-server', type: 'mcp-server' },
      { kind: 'Resource', cat: 'ai-model', type: 'ai-model' },
      { kind: 'Resource', cat: 'model-server', type: 'ai-model-server' },
    ];

    const entities = categories.map(c =>
      makeEntity({
        kind: c.kind,
        metadata: {
          name: `test-${c.cat}`,
          annotations: {
            'rhdh.io/ai-asset-category': c.cat,
            'rhdh.io/ai-asset-version': '1.0.0',
            'rhdh.io/ai-asset-source': 'test',
          },
        },
        spec: { type: c.type },
      }),
    );

    // Add some non-AI entities that should be excluded
    entities.push(
      makeEntity({
        kind: 'Component',
        metadata: { name: 'plain-component' },
      }),
    );

    const report = analyzeEntities(entities);
    expect(report.entities).toHaveLength(7);
  });

  it('does not include kind:McpServer rename in any assessment', () => {
    const categories = [
      { kind: 'Component', cat: 'agent', type: 'ai-agent' },
      { kind: 'AIResource', cat: 'skill', type: 'skill' },
      { kind: 'AIResource', cat: 'rule', type: 'rule' },
      { kind: 'AIResource', cat: 'skill-bundle', type: 'ai-skill-bundle' },
      { kind: 'API', cat: 'mcp-server', type: 'mcp-server' },
      { kind: 'Resource', cat: 'ai-model', type: 'ai-model' },
      { kind: 'Resource', cat: 'model-server', type: 'ai-model-server' },
    ];

    const entities = categories.map(c =>
      makeEntity({
        kind: c.kind,
        metadata: {
          name: `test-${c.cat}`,
          annotations: {
            'rhdh.io/ai-asset-category': c.cat,
            'rhdh.io/ai-asset-version': '1.0.0',
            'rhdh.io/ai-asset-source': 'test',
          },
        },
        spec: { type: c.type },
      }),
    );

    const report = analyzeEntities(entities);
    for (const entity of report.entities) {
      expect(entity.targetKind).not.toBe('McpServer');
      for (const t of entity.transformations) {
        expect(t).not.toContain('kind: McpServer');
        expect(t).not.toContain('kind:McpServer');
      }
    }
  });
});
