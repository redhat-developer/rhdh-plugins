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
import { useRelatedEntities } from '@backstage/plugin-catalog-react';
import {
  getSubcomponentsWithFallback,
  getSubcomponentNames,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';

/**
 * Hook to get subcomponents of the current entity.
 *
 * In Konflux plugin, a "subcomponent" refers to a Backstage Component that has a
 * `subcomponentOf` relationship to the current Component being viewed.
 * Backstage automatically creates a `partOf` relation from the subcomponent
 * entity to the parent entity, which is what we query for.
 *
 * If no subcomponents are found, this hook falls back to returning the main entity.
 *
 * @param entity - The main/parent entity to find subcomponents for
 * @returns Object containing:
 *   - subcomponentEntities: Array of subcomponent entities (or [entity] if none found)
 *   - subcomponentNames: Array of subcomponent names
 *   - loading: Whether the query is still loading
 *   - error: Any error that occurred during the query
 */
export const useEntitySubcomponents = (entity: Entity) => {
  const {
    entities: hasPartEntities,
    loading: hasPartLoading,
    error: hasPartError,
  } = useRelatedEntities(entity, {});

  const subcomponentEntities = getSubcomponentsWithFallback(
    hasPartEntities,
    entity,
  );

  const subcomponentNames = getSubcomponentNames(subcomponentEntities);

  return {
    subcomponentEntities,
    subcomponentNames,
    loading: hasPartLoading,
    error: hasPartError,
  };
};
