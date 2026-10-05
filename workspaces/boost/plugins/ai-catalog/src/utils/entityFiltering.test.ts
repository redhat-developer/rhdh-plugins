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

import { applyEntityFilters, getSortValue } from './entityFiltering';

const entities: Entity[] = [
  {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'AiResource',
    metadata: {
      name: 'code-review',
      description: 'Security skill',
      tags: ['security'],
    },
    spec: { type: 'skill', owner: 'team-ai' },
  },
  {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'AiResource',
    metadata: { name: 'dev-assistant', description: 'Developer assistant' },
    spec: { type: 'agent', owner: 'team-ml' },
  },
];

const typeFilter: FilterDefinition = {
  urlParam: 'type',
  label: 'Type',
  getOptions: () => [],
  matchEntity: (entity, values) =>
    values.some(
      value => value.toLowerCase() === String(entity.spec?.type).toLowerCase(),
    ),
  priority: 100,
};

describe('applyEntityFilters', () => {
  it('returns all entities when no search or filters are active', () => {
    expect(applyEntityFilters(entities, undefined, [], new Map())).toHaveLength(
      2,
    );
  });

  it('combines case-insensitive search and filters with AND logic', () => {
    expect(
      applyEntityFilters(
        entities,
        'CODE-REVIEW',
        [typeFilter],
        new Map([['type', ['skill']]]),
      ),
    ).toEqual([entities[0]]);
  });

  it('skips filters with no active values', () => {
    expect(
      applyEntityFilters(entities, undefined, [typeFilter], new Map()),
    ).toHaveLength(2);
  });
});

describe('getSortValue', () => {
  const sortableEntity: Entity = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'AiResource',
    metadata: {
      name: 'skill-name',
      title: 'Skill title',
      description: 'Skill description',
      annotations: { 'rhdh.io/ai-asset-source': 'ogx' },
    },
    spec: { type: 'skill', owner: 'team-ai' },
  };

  it.each([
    ['title', 'Skill title'],
    ['categoryLabel', 'Skills'],
    ['owner', 'team-ai'],
    ['provider', 'ogx'],
    ['description', 'Skill description'],
    ['unknown', ''],
  ])('returns the value for the %s column', (columnId, expected) => {
    expect(getSortValue(sortableEntity, columnId)).toBe(expected);
  });
});
