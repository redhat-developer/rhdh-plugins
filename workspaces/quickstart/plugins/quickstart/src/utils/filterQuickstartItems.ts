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

import { QuickstartItemData } from '../types';

/**
 * Information on which dynamic plugins or capabilities are available in the runtime.
 *
 * @public
 */
export type PluginAvailability = {
  isCatalogAvailable: boolean;
  isScaffolderAvailable: boolean;
  isTechDocsAvailable: boolean;
  isApiDocsAvailable: boolean;
  isAdoptionInsightsAvailable?: boolean;
  isExtensionsAvailable?: boolean;
};

/**
 * Filters quickstart items based on user role.
 *
 * @param items - Array of quickstart items to filter
 * @param userRole - The user's role ('admin' or 'developer')
 * @returns Filtered array of quickstart items available to the user
 *
 * @public
 */
export const filterQuickstartItemsByRole = (
  items: QuickstartItemData[],
  userRole: string,
): QuickstartItemData[] => {
  return items.filter(item => {
    // If roles is undefined or empty, default to 'admin'
    const roles = item.roles?.length ? item.roles : ['admin'];
    return roles.includes(userRole);
  });
};

/**
 * Filters quickstart items based on the availability of dependent plugins.
 * Hides items like Catalog, Scaffolder, TechDocs, or APIs when the
 * corresponding dynamic plugin is disabled or unmounted.
 *
 * @param items - Array of quickstart items to filter
 * @param availability - Flags indicating which plugins are active
 * @returns Filtered array of quickstart items whose required plugins are present
 *
 * @public
 */
export const filterQuickstartItemsByAvailability = (
  items: QuickstartItemData[],
  availability: PluginAvailability,
): QuickstartItemData[] => {
  return items.filter(item => {
    const link = item.cta?.link?.toLowerCase() ?? '';
    const icon = item.icon?.toLowerCase() ?? '';

    // Catalog items (/catalog, /catalog-import, or icon catalog)
    if (link.startsWith('/catalog') || icon === 'catalog') {
      if (!availability.isCatalogAvailable) {
        return false;
      }
    }

    // Scaffolder items (/create or icon scaffolder)
    // Requires both Scaffolder plugin AND Catalog API availability (templates are stored in catalog)
    if (link.startsWith('/create') || icon === 'scaffolder') {
      if (!availability.isScaffolderAvailable || !availability.isCatalogAvailable) {
        return false;
      }
    }

    // TechDocs items (/docs or icon techdocs)
    // Requires both TechDocs plugin AND Catalog API availability
    if (link.startsWith('/docs') || icon === 'techdocs') {
      if (!availability.isTechDocsAvailable || !availability.isCatalogAvailable) {
        return false;
      }
    }

    // API Docs items (/api-docs or icon kind:api)
    // Requires API Docs and Catalog API availability
    if (link.startsWith('/api-docs') || icon === 'kind:api') {
      if (!availability.isApiDocsAvailable || !availability.isCatalogAvailable) {
        return false;
      }
    }

    // Adoption Insights items
    if (link.startsWith('/adoption-insights')) {
      if (
        availability.isAdoptionInsightsAvailable !== undefined &&
        !availability.isAdoptionInsightsAvailable
      ) {
        return false;
      }
    }

    // Extensions items
    if (link.startsWith('/extensions')) {
      if (
        availability.isExtensionsAvailable !== undefined &&
        !availability.isExtensionsAvailable
      ) {
        return false;
      }
    }

    return true;
  });
};
