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
import { getAllCategories } from '../utils/categoryMeta';
import { getSpecField } from '../utils/entityHelpers';

function uniqueSorted(
  items: (string | undefined)[],
): { id: string; label: string }[] {
  const set = new Set<string>();
  for (const item of items) {
    if (item) set.add(item);
  }
  return Array.from(set)
    .sort((a, b) => a.localeCompare(b))
    .map(v => ({ id: v, label: v }));
}

function matchesCaseInsensitive(
  value: string | undefined,
  selected: string[],
): boolean {
  return (
    value !== undefined &&
    selected.some(s => s.toLowerCase() === value.toLowerCase())
  );
}

export const categoryFilterDefinition: FilterDefinition = {
  urlParam: 'type',
  label: 'Type',
  labelKey: 'catalog.filter.type',
  getOptions: (_entities: Entity[]) => getAllCategories(),
  matchEntity: (entity: Entity, values: string[]) =>
    matchesCaseInsensitive(getSpecField(entity, 'type'), values),
  priority: 100,
};

export const providerFilterDefinition: FilterDefinition = {
  urlParam: 'provider',
  label: 'Provider',
  labelKey: 'catalog.filter.provider',
  getOptions: (entities: Entity[]) =>
    uniqueSorted(
      entities.map(e => e.metadata.annotations?.['rhdh.io/ai-asset-source']),
    ),
  matchEntity: (entity: Entity, values: string[]) =>
    matchesCaseInsensitive(
      entity.metadata.annotations?.['rhdh.io/ai-asset-source'],
      values,
    ),
  priority: 200,
};

export const ownerFilterDefinition: FilterDefinition = {
  urlParam: 'owner',
  label: 'Owner',
  labelKey: 'catalog.filter.owner',
  getOptions: (entities: Entity[]) =>
    uniqueSorted(entities.map(e => getSpecField(e, 'owner'))),
  matchEntity: (entity: Entity, values: string[]) =>
    matchesCaseInsensitive(getSpecField(entity, 'owner'), values),
  priority: 300,
};

export const tagsFilterDefinition: FilterDefinition = {
  urlParam: 'tag',
  label: 'Tag',
  labelKey: 'catalog.filter.tag',
  getOptions: (entities: Entity[]) =>
    uniqueSorted(entities.flatMap(e => e.metadata.tags ?? [])),
  matchEntity: (entity: Entity, values: string[]) => {
    const tagSet = new Set(values.map(t => t.toLowerCase()));
    return (entity.metadata.tags ?? []).some(t => tagSet.has(t.toLowerCase()));
  },
  priority: 400,
};
