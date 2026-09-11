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

import type { FilterDefinition } from '../blueprints/AiCatalogFilterBlueprint';
import {
  applyEntityFilters,
  entityRefHref,
  getAgentModel,
  getDistinctSpecField,
  getHandoffRefs,
  getModelsAvailable,
  getProvider,
  getSpecRemotes,
  getSpecField,
  getStringArraySpecField,
} from './entityHelpers';

const skill: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: {
    name: 'code-review',
    namespace: 'default',
    description: 'Automated code review skill',
    tags: ['security'],
  },
  spec: { type: 'skill', lifecycle: 'production', owner: 'team-ai' },
};

const agent: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: {
    name: 'dev-assistant',
    namespace: 'default',
    description: 'AI developer assistant',
    tags: ['agent'],
  },
  spec: { type: 'agent', lifecycle: 'experimental', owner: 'team-ml' },
};

describe('entityRefHref', () => {
  it('builds a group catalog URL from a bare owner name', () => {
    expect(entityRefHref('team-ai-platform')).toBe(
      '/catalog/default/group/team-ai-platform',
    );
  });

  it('parses a fully-qualified group ref', () => {
    expect(entityRefHref('group:other-ns/platform')).toBe(
      '/catalog/other-ns/group/platform',
    );
  });

  it('parses a fully-qualified user ref', () => {
    expect(entityRefHref('user:default/jdoe')).toBe(
      '/catalog/default/user/jdoe',
    );
  });

  it('returns undefined for an unparseable ref', () => {
    expect(entityRefHref('group:')).toBeUndefined();
  });
});

describe('entity metadata accessors', () => {
  it('reads the provider facet from the source annotation', () => {
    const entity: Entity = {
      ...skill,
      metadata: {
        ...skill.metadata,
        annotations: { 'rhdh.io/ai-asset-source': 'ogx' },
      },
    };

    expect(getProvider(entity)).toBe('ogx');
  });

  it('reads the typed agent model', () => {
    const entity: Entity = {
      ...agent,
      spec: {
        ...agent.spec,
        model: 'typed-model',
      },
    };

    expect(getAgentModel(entity)).toBe('typed-model');
    expect(getAgentModel({ ...entity, spec: agent.spec })).toBeUndefined();
  });

  it('ignores non-string spec values', () => {
    expect(
      getSpecField(
        {
          ...skill,
          spec: { type: 'skill', enabled: true, count: 2 },
        },
        'enabled',
      ),
    ).toBeUndefined();
    expect(getSpecField({ ...skill, spec: undefined }, 'type')).toBeUndefined();
  });

  it('returns spec text only when it differs from the description', () => {
    expect(
      getDistinctSpecField(
        { ...skill, spec: { ...skill.spec, instructions: 'Use the skill.' } },
        'instructions',
      ),
    ).toBe('Use the skill.');
    expect(
      getDistinctSpecField(
        {
          ...skill,
          spec: { ...skill.spec, instructions: skill.metadata.description },
        },
        'instructions',
      ),
    ).toBeUndefined();
  });

  it('returns unique string model names from the model list', () => {
    expect(
      getModelsAvailable({
        ...skill,
        spec: {
          type: 'ai-model-server',
          models: { available: ['model-a', 42, 'model-a', null, 'model-b'] },
        },
      }),
    ).toEqual(['model-a', 'model-b']);
  });

  it('returns unique non-empty handoff references', () => {
    expect(
      getHandoffRefs({
        ...agent,
        spec: {
          ...agent.spec,
          handoffs: [
            'airesource:default/legal',
            ' ',
            'airesource:default/legal',
            42,
            ' airesource:default/support ',
          ],
        },
      }),
    ).toEqual(['airesource:default/legal', 'airesource:default/support']);
  });

  it('returns unique string values from list-valued spec fields', () => {
    expect(
      getStringArraySpecField(
        {
          ...skill,
          spec: {
            ...skill.spec,
            categories: ['security', 'security', '', 42, ' quality '],
          },
        },
        'categories',
      ),
    ).toEqual(['security', 'quality']);
  });

  it('returns valid remote entries and ignores malformed values', () => {
    expect(
      getSpecRemotes({
        ...skill,
        spec: {
          ...skill.spec,
          remotes: [
            { url: 'https://mcp.example.com', type: 'streamable-http' },
            { url: '  ' },
            { type: 'missing-url' },
            'invalid',
          ],
        },
      }),
    ).toEqual([{ url: 'https://mcp.example.com', type: 'streamable-http' }]);
  });
});

const entities = [skill, agent];

const typeFilter: FilterDefinition = {
  urlParam: 'type',
  label: 'Type',
  getOptions: () => [],
  matchEntity: (e, vals) => {
    const t = (e.spec as Record<string, unknown>)?.type as string | undefined;
    return (
      t !== undefined && vals.some(v => v.toLowerCase() === t.toLowerCase())
    );
  },
  priority: 100,
};

const ownerFilter: FilterDefinition = {
  urlParam: 'owner',
  label: 'Owner',
  getOptions: () => [],
  matchEntity: (e, vals) => {
    const o = (e.spec as Record<string, unknown>)?.owner as string | undefined;
    return (
      o !== undefined && vals.some(v => v.toLowerCase() === o.toLowerCase())
    );
  },
  priority: 200,
};

describe('applyEntityFilters', () => {
  it('returns all entities when no search or filters active', () => {
    const result = applyEntityFilters(entities, undefined, [], new Map());
    expect(result).toHaveLength(2);
  });

  it('filters by search term in name', () => {
    const result = applyEntityFilters(entities, 'code-review', [], new Map());
    expect(result).toHaveLength(1);
    expect(result[0].metadata.name).toBe('code-review');
  });

  it('filters by search term in description', () => {
    const result = applyEntityFilters(
      entities,
      'developer assistant',
      [],
      new Map(),
    );
    expect(result).toHaveLength(1);
    expect(result[0].metadata.name).toBe('dev-assistant');
  });

  it('filters by search term in tags', () => {
    const result = applyEntityFilters(entities, 'security', [], new Map());
    expect(result).toHaveLength(1);
    expect(result[0].metadata.name).toBe('code-review');
  });

  it('applies single filter via matchEntity', () => {
    const values = new Map([['type', ['skill']]]);
    const result = applyEntityFilters(
      entities,
      undefined,
      [typeFilter],
      values,
    );
    expect(result).toHaveLength(1);
    expect(result[0].metadata.name).toBe('code-review');
  });

  it('applies multiple filters in AND logic', () => {
    const values = new Map([
      ['type', ['skill']],
      ['owner', ['team-ml']],
    ]);
    const result = applyEntityFilters(
      entities,
      undefined,
      [typeFilter, ownerFilter],
      values,
    );
    expect(result).toHaveLength(0);
  });

  it('combines search with filters in AND logic', () => {
    const values = new Map([['type', ['skill']]]);
    const result = applyEntityFilters(entities, 'code', [typeFilter], values);
    expect(result).toHaveLength(1);
    expect(result[0].metadata.name).toBe('code-review');
  });

  it('skips filters with no active values', () => {
    const values = new Map<string, string[]>();
    const result = applyEntityFilters(
      entities,
      undefined,
      [typeFilter, ownerFilter],
      values,
    );
    expect(result).toHaveLength(2);
  });

  it('search is case-insensitive', () => {
    const result = applyEntityFilters(entities, 'CODE-REVIEW', [], new Map());
    expect(result).toHaveLength(1);
  });
});
