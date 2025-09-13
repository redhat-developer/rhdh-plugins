/*
 * Copyright The Backstage Authors
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

import { useMemo, useCallback } from 'react';

import { ExtendedSelectItem } from '../types';
import { useSearchParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import {
  MarketplaceAnnotation,
  SupportLevel,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import { usePluginFacet } from '../hooks/usePluginFacet';
import { usePluginFacets } from '../hooks/usePluginFacets';
import { CustomSelectFilter } from '../shared-components/CustomSelectFilter';
import { useQueryArrayFilter } from '../hooks/useQueryArrayFilter';
import { colors } from '../consts';

const CategoryFilter = () => {
  const categoriesFacet = usePluginFacet('spec.categories');
  const filter = useQueryArrayFilter('spec.categories');
  const categories = categoriesFacet.data;

  const items = useMemo(() => {
    if (!categories) return [];
    return categories.map(category => ({
      label: category.value,
      value: category.value,
    }));
  }, [categories]);

  const handleChange = useCallback(
    (_e: any, value: ExtendedSelectItem[]) => {
      const newSelection = value.map(v => v.value);
      filter.set(newSelection);
    },
    [filter],
  );

  return (
    <CustomSelectFilter
      label="Category"
      items={items}
      onChange={handleChange}
      selectedItems={filter.current}
    />
  );
};

const AuthorFilter = () => {
  const authorsFacet = usePluginFacet('spec.authors.name');
  const authors = authorsFacet.data;
  const filter = useQueryArrayFilter('spec.authors.name');

  const items = useMemo(() => {
    if (!authors) return [];
    return authors.map(author => ({
      label: author.value,
      value: author.value,
    }));
  }, [authors]);

  const handleChange = useCallback(
    (_e: any, value: ExtendedSelectItem[]) => {
      const newSelection = value.map(v => v.label);
      filter.set(newSelection);
    },
    [filter],
  );

  return (
    <CustomSelectFilter
      label="Author"
      items={items}
      onChange={handleChange}
      selectedItems={filter.current}
    />
  );
};

const facetsKeys = [
  `metadata.annotations.${MarketplaceAnnotation.CERTIFIED_BY}`,
  'spec.support.level',
];

const evaluateParams = (
  newSelection: (string | number)[],
  newParams: URLSearchParams,
) => {
  if (Array.isArray(newSelection)) {
    newSelection.forEach(v => newParams.append('filter', String(v)));
  } else {
    newParams.append('filter', String(newSelection));
  }
};

const SupportTypeFilter = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const pluginFacets = usePluginFacets({ facets: facetsKeys });

  const facets = pluginFacets.data;

  const items = useMemo(() => {
    if (!facets) return [];
    const allSupportTypeItems: ExtendedSelectItem[] = [];

    // Certified plugins
    const certified = facets[facetsKeys[0]];
    certified?.forEach(certifiedBy => {
      allSupportTypeItems.push({
        label: `Certified (${certifiedBy.count})`,
        value: `${facetsKeys[0]}=${certifiedBy.value}`,
        isBadge: true,
        badgeColor: colors.certified,
        helperText: 'Stable and secured by Red Hat',
        displayOrder: 2,
      });
    });

    const supportLevelFilters = facets[facetsKeys[1]];
    supportLevelFilters?.forEach(supportLevelFilter => {
      if (supportLevelFilter.value === SupportLevel.GENERALLY_AVAILABLE) {
        allSupportTypeItems.push({
          label: `Generally available (${supportLevelFilter.count})`,
          value: `${facetsKeys[1]}=${supportLevelFilter.value}`,
          isBadge: true,
          badgeColor: colors.generallyAvailable,
          helperText: 'Production-ready and supported',
          displayOrder: 1,
        });
      } else if (supportLevelFilter.value === SupportLevel.CUSTOM_PLUGIN) {
        allSupportTypeItems.push({
          label: `Custom plugin (${supportLevelFilter.count})`,
          value: `${facetsKeys[1]}=${supportLevelFilter.value}`,
          isBadge: true,
          badgeColor: colors.custom,
          helperText: 'Added by the administrator',
          displayOrder: 3,
        });
      } else if (supportLevelFilter.value === SupportLevel.COMMUNITY_PLUGIN) {
        allSupportTypeItems.push({
          label: `Community plugin (${supportLevelFilter.count})`,
          value: `${facetsKeys[1]}=${supportLevelFilter.value}`,
          helperText: 'Open-source plugins, no official support',
          displayOrder: 6,
        });
      } else if (supportLevelFilter.value === SupportLevel.TECH_PREVIEW) {
        allSupportTypeItems.push({
          label: `Tech preview (TP) (${supportLevelFilter.count})`,
          value: `${facetsKeys[1]}=${supportLevelFilter.value}`,
          helperText: 'Plugin still in development',
          displayOrder: 5,
        });
      } else if (supportLevelFilter.value === SupportLevel.DEV_PREVIEW) {
        allSupportTypeItems.push({
          label: `Dev preview (DP) (${supportLevelFilter.count})`,
          value: `${facetsKeys[1]}=${supportLevelFilter.value}`,
          helperText: 'An early-stage, experimental plugin',
          displayOrder: 4,
        });
      }
    });

    return allSupportTypeItems.sort(
      (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0),
    );
  }, [facets]);

  const selected = useMemo(() => {
    const selectedFilters = searchParams
      .getAll('filter')
      .filter(
        filter =>
          filter.startsWith('metadata.annotations.extensions.backstage.io/') ||
          filter.startsWith('spec.support.'),
      );
    return items?.filter(item => {
      const itemValue = item.value.toString();
      return selectedFilters.includes(itemValue);
    });
  }, [searchParams, items]);

  const onChange = useCallback(
    (newValues: ExtendedSelectItem[]) => {
      const newSelection = newValues.map(v => v.value);
      setSearchParams(
        params => {
          const newParams = new URLSearchParams();

          let added = false;
          const add = () => {
            if (added) return;
            evaluateParams(newSelection, newParams);

            added = true;
          };

          // Try to keep the right position...
          params.forEach((value, key) => {
            if (
              key === 'filter' &&
              (value.startsWith(
                `metadata.annotations.extensions.backstage.io/`,
              ) ||
                value.startsWith('spec.support.'))
            ) {
              add();
            } else {
              newParams.append(key, value);
            }
          });

          // If not added yet, add it at the end
          add();
          return newParams;
        },
        {
          replace: true,
        },
      );
    },
    [setSearchParams],
  );

  return (
    <CustomSelectFilter
      label="Support status"
      items={items}
      onChange={(_e, value) => onChange(value)}
      selectedItems={selected}
    />
  );
};

export const MarketplacePluginFilter = () => {
  return (
    <Box sx={{ minWidth: { xs: 200, lg: 'auto' } }}>
      <CategoryFilter />
      <AuthorFilter />
      <SupportTypeFilter />
    </Box>
  );
};
