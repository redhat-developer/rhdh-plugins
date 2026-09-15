/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 */

import type { Entity } from '@backstage/catalog-model';
import type { FilterDefinition } from '../blueprints/AiCatalogFilterBlueprint';

import { applyEntityFilters } from './entityFiltering';

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
