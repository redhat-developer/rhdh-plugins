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
import { parseEntityRef } from '@backstage/catalog-model';

import type { FilterDefinition } from '../blueprints/AiCatalogFilterBlueprint';
import { getCategoryMeta } from './categoryMeta';

const AI_ASSET_SOURCE_ANNOTATION = 'rhdh.io/ai-asset-source';

function catalogHref(kind: string, namespace: string, name: string): string {
  return `/catalog/${namespace}/${kind.toLowerCase()}/${name}`;
}

function getSpecObject(entity: Entity): Record<string, unknown> | undefined {
  return typeof entity.spec === 'object' && entity.spec !== null
    ? (entity.spec as Record<string, unknown>)
    : undefined;
}

export function entityHref(entity: Entity): string {
  const namespace = entity.metadata.namespace ?? 'default';
  return catalogHref(entity.kind, namespace, entity.metadata.name);
}

/**
 * Builds a catalog entity page URL from an entity ref string (e.g. an
 * owner value from `spec.owner`), which may be a bare name, a
 * `kind:namespace/name` ref, or a `kind:name` ref. Bare names default to
 * kind `group` in the `default` namespace, matching common Backstage
 * conventions for `spec.owner`.
 *
 * Returns `undefined` when `ref` is not a valid entity ref, so callers can
 * omit the link instead of throwing.
 */
export function entityRefHref(ref: string): string | undefined {
  try {
    const { kind, namespace, name } = parseEntityRef(ref, {
      defaultKind: 'group',
      defaultNamespace: 'default',
    });
    return catalogHref(kind, namespace, name);
  } catch {
    return undefined;
  }
}

export function getSpecField(
  entity: Entity,
  field: string,
): string | undefined {
  const value = getSpecObject(entity)?.[field];
  return typeof value === 'string' ? value : undefined;
}

/** Returns a spec string when it adds information beyond the entity description. */
export function getDistinctSpecField(
  entity: Entity,
  field: string,
): string | undefined {
  const value = getSpecField(entity, field);
  const description = entity.metadata.description ?? '';
  return value && value.trim() !== description.trim() ? value : undefined;
}

function getUniqueStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value.flatMap(item => {
        if (typeof item !== 'string' || item.trim().length === 0) return [];
        return [item.trim()];
      }),
    ),
  );
}

/** Returns unique, non-empty string values from a list-valued spec field. */
export function getStringArraySpecField(
  entity: Entity,
  field: string,
): string[] {
  return getUniqueStrings(getSpecObject(entity)?.[field]);
}

export interface EntityRemote {
  url: string;
  type?: string;
}

/** Returns valid remote entries from an entity's spec.remotes field. */
export function getSpecRemotes(entity: Entity): EntityRemote[] {
  const value = getSpecObject(entity)?.remotes;
  if (!Array.isArray(value)) return [];

  return value.flatMap(remote => {
    if (typeof remote !== 'object' || remote === null) return [];
    const entry = remote as Record<string, unknown>;
    const url = typeof entry.url === 'string' ? entry.url.trim() : '';
    if (!url) {
      return [];
    }
    const type =
      typeof entry.type === 'string' && entry.type.trim().length > 0
        ? entry.type.trim()
        : undefined;

    return [
      {
        url,
        ...(type && { type }),
      },
    ];
  });
}

export function getModelsAvailable(entity: Entity): string[] {
  const models = getSpecObject(entity)?.models;
  if (typeof models !== 'object' || models === null) return [];

  return getUniqueStrings((models as Record<string, unknown>).available);
}

/**
 * Returns the provider facet from the AI asset source annotation.
 */
export function getProvider(entity: Entity): string | undefined {
  return entity.metadata.annotations?.[AI_ASSET_SOURCE_ANNOTATION];
}

/** Returns an agent's configured model from the typed spec field. */
export function getAgentModel(entity: Entity): string | undefined {
  return getSpecField(entity, 'model');
}

/** Returns the target entity references configured for an agent's handoffs. */
export function getHandoffRefs(entity: Entity): string[] {
  return getStringArraySpecField(entity, 'handoffs');
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
      return getProvider(entity) ?? '';
    case 'description':
      return entity.metadata.description ?? '';
    default:
      return '';
  }
}
