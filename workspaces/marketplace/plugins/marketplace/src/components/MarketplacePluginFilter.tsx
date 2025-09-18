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

import { useSearchParams } from 'react-router-dom';

import Box from '@mui/material/Box';

import {
  MarketplaceAnnotation,
  MarketplaceSupportLevel,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import { usePluginFacet } from '../hooks/usePluginFacet';
import { usePluginFacets } from '../hooks/usePluginFacets';
import {
  CustomSelectFilter,
  CustomSelectItem,
} from '../shared-components/CustomSelectFilter';
import { useQueryArrayFilter } from '../hooks/useQueryArrayFilter';
import { colors } from '../consts';

const CategoryFilter = () => {
  const categoriesFacet = usePluginFacet('spec.categories');
  const filter = useQueryArrayFilter('category');
  const categories = categoriesFacet.data;

  const items = useMemo(() => {
    if (!categories) return [];
    return categories.map(category => ({
      label: category.value,
      value: category.value,
      count: category.count,
    }));
  }, [categories]);

  const handleChange = useCallback(
    (_e: any, value: CustomSelectItem[]) => {
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
  const filter = useQueryArrayFilter('author');

  const items = useMemo(() => {
    if (!authors) return [];
    return authors.map(author => ({
      label: author.value,
      value: author.value,
      count: author.count,
    }));
  }, [authors]);

  const handleChange = useCallback(
    (_e: any, value: CustomSelectItem[]) => {
      const newSelection = value.map(v => v.value);
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
  `metadata.annotations.${MarketplaceAnnotation.PRE_INSTALLED}`,
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
    const allSupportTypeItems: CustomSelectItem[] = [];

    // Certified plugins
    const certified = facets[facetsKeys[0]];
    const certifiedCount =
      certified?.reduce((acc, curr) => acc + curr.count, 0) || 0;
    // const certifiedFilter = certified?.map(c => c.value).join(', ') || '';
    const certifiedProviders = certified?.map(c => c.value).join(', ') || '';

    allSupportTypeItems.push({
      label: 'Certified',
      value: 'certified',
      count: certifiedCount,
      isBadge: true,
      badgeColor: colors.certified,
      helperText: `Stable and secured by ${certifiedProviders}`,
      displayOrder: 2,
    });

    // Custom plugins
    const preinstalled = facets[facetsKeys[1]];
    const customCount =
      preinstalled?.find(p => p.value === 'false')?.count ?? 0;
    if (customCount > 0) {
      allSupportTypeItems.push({
        label: 'Custom plugin',
        value: 'custom',
        count: customCount,
        isBadge: true,
        badgeColor: colors.custom,
        helperText: 'Added by the administrator',
        displayOrder: 3,
      });
    }

    const supportLevelFilters = facets[facetsKeys[2]];
    supportLevelFilters?.forEach(supportLevelFilter => {
      if (
        supportLevelFilter.value === MarketplaceSupportLevel.GENERALLY_AVAILABLE
      ) {
        allSupportTypeItems.push({
          label: 'Generally available (GA)',
          value: `support-level=${supportLevelFilter.value}`,
          count: supportLevelFilter.count,
          isBadge: true,
          badgeColor: colors.generallyAvailable,
          helperText: 'Production-ready and supported',
          displayOrder: 1,
        });
      } else if (
        supportLevelFilter.value === MarketplaceSupportLevel.TECH_PREVIEW
      ) {
        allSupportTypeItems.push({
          label: 'Tech preview (TP)',
          value: `support-level=${supportLevelFilter.value}`,
          count: supportLevelFilter.count,
          helperText: 'Plugin still in development',
          displayOrder: 4,
        });
      } else if (
        supportLevelFilter.value === MarketplaceSupportLevel.DEV_PREVIEW
      ) {
        allSupportTypeItems.push({
          label: 'Dev preview (DP)',
          value: `support-level=${supportLevelFilter.value}`,
          count: supportLevelFilter.count,
          helperText: 'An early-stage, experimental plugin',
          displayOrder: 5,
        });
      } else if (
        supportLevelFilter.value === MarketplaceSupportLevel.COMMUNITY
      ) {
        allSupportTypeItems.push({
          label: 'Community plugin',
          value: `support-level=${supportLevelFilter.value}`,
          count: supportLevelFilter.count,
          helperText: 'Open-source plugins, no official support',
          displayOrder: 6,
        });
      }
    });

    return allSupportTypeItems.sort(
      (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0),
    );
  }, [facets]);

  const selected = useMemo(() => {
    const selectedFilters = searchParams.getAll('filter');
    return items.filter(item => {
      if (item.value === 'certified') {
        return selectedFilters.includes('certified');
      }
      if (item.value === 'custom') {
        return selectedFilters.includes('custom');
      }
      if (item.value.toString().startsWith('support-level=')) {
        return selectedFilters.includes(item.value.toString());
      }
      return false;
    });
  }, [searchParams, items]);

  const onChange = useCallback(
    (newValues: CustomSelectItem[]) => {
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
              (value === `certified` ||
                value === `custom` ||
                value.startsWith('support-level='))
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
