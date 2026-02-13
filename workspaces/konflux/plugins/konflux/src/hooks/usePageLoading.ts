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

import { useEntitySubcomponents } from './useEntitySubcomponents';
import { Entity } from '@backstage/catalog-model';

/**
 * Hook to handle page loading state and subcomponent information.
 * Extracts common loading pattern used across Konflux pages.
 *
 * @param entity - The entity to get subcomponents for
 * @returns Object containing loading state and subcomponent information
 */
export const usePageLoading = (entity: Entity) => {
  const { subcomponentEntities, loading } = useEntitySubcomponents(entity);

  return {
    loading,
    hasSubcomponents: (subcomponentEntities?.length || 0) > 1,
    subcomponentEntities,
  };
};
