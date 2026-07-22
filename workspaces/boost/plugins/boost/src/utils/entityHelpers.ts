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
import { getCategoryMeta } from './categoryMeta';

export function entityHref(entity: Entity): string {
  const namespace = entity.metadata.namespace ?? 'default';
  const kind = entity.kind.toLowerCase();
  const name = entity.metadata.name;
  return `/catalog/${namespace}/${kind}/${name}`;
}

export function getSpecField(
  entity: Entity,
  field: string,
): string | undefined {
  return (entity.spec as Record<string, unknown> | undefined)?.[field] as
    | string
    | undefined;
}

/**
 * Apply search + registered filter definitions in AND logic.
 * Search is built-in (not a FilterDefinition). Each FilterDefinition
 * with active values must match for the entity to be included.
 */
export function applyEntityFilters(
  items: Entity[],
  search: string | undefined,
  filters: FilterDefinition[],
  filterValues: Map<string, string[]>,
): Entity[] {
  let results = items;

  if (search) {
    const term = search.toLowerCase();
    results = results.filter(
      e =>
        e.metadata.name.toLowerCase().includes(term) ||
        (e.metadata.title ?? '').toLowerCase().includes(term) ||
        (e.metadata.description ?? '').toLowerCase().includes(term) ||
        (e.metadata.tags ?? []).some(t => t.toLowerCase().includes(term)),
    );
  }

  for (const filter of filters) {
    const values = filterValues.get(filter.urlParam);
    if (values && values.length > 0) {
      results = results.filter(e => filter.matchEntity(e, values));
    }
  }

  return results;
}

export function getSortValue(entity: Entity, columnId: string): string {
  switch (columnId) {
    case 'title':
      return entity.metadata.title ?? entity.metadata.name;
    case 'categoryLabel':
      return getCategoryMeta(getSpecField(entity, 'type')).label;
    case 'owner':
      return getSpecField(entity, 'owner') ?? '';
    case 'provider':
      return entity.metadata.annotations?.['rhdh.io/ai-asset-source'] ?? '';
    case 'description':
      return entity.metadata.description ?? '';
    default:
      return '';
  }
}
