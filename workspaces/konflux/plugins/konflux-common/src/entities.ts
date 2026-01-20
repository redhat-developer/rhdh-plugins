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

import { Entity } from '@backstage/catalog-model';

/**
 * Filters and processes subcomponent entities with fallback logic.
 *
 * In Konflux plugin, a "subcomponent" refers to a Backstage Component that has a
 * `subcomponentOf` relationship to the current Component being viewed.
 * Backstage automatically creates a `partOf` relation from the subcomponent
 * entity to the parent entity, which is what we query for.
 *
 * This function:
 * 1. Filters out entities named 'guest' (system entity)
 * 2. Filters to only entities with 'partOf' relations (true subcomponents)
 * 3. Falls back to the main entity if no subcomponents are found
 *
 * @param relatedEntities - Array of entities that have a 'partOf' relation to the main entity, or null/undefined
 * @param mainEntity - The main/parent entity to fall back to if no subcomponents exist
 * @returns Array of subcomponent entities, or [mainEntity] if no subcomponents found
 *
 * @public
 */
export function getSubcomponentsWithFallback(
  relatedEntities: Entity[] | null | undefined,
  mainEntity: Entity,
): Entity[] {
  if (!relatedEntities?.length) {
    return [mainEntity];
  }

  const filtered = relatedEntities.filter(
    e =>
      e.metadata.name !== 'guest' &&
      e.relations?.some(rel => rel?.type === 'partOf'),
  );

  // fallback to main entity if no valid subcomponents found
  if (!filtered.length) {
    return [mainEntity];
  }

  return filtered;
}

/**
 * Extracts subcomponent names from an array of entities.
 *
 * @param entities - Array of entities to extract names from
 * @returns Array of entity names
 *
 * @public
 */
export function getSubcomponentNames(entities: Entity[]): string[] {
  return entities.map(e => e.metadata.name);
}
