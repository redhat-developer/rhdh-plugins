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

import { SelectItem } from '@backstage/core-components';
import { useSearchParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import { MarketplaceAnnotation } from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import { usePluginFacet } from '../hooks/usePluginFacet';
import { usePluginFacets } from '../hooks/usePluginFacets';
import { CustomSelectFilter } from '../shared-components/CustomSelectFilter';
import { useQueryArrayFilter } from '../hooks/useQueryArrayFilter';

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
    (_e: any, value: SelectItem[]) => {
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
    (_e: any, value: SelectItem[]) => {
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
  `metadata.annotations.${MarketplaceAnnotation.VERIFIED_BY}`,
  `metadata.annotations.${MarketplaceAnnotation.PRE_INSTALLED}`,
  `metadata.annotations.${MarketplaceAnnotation.SUPPORT_TYPE}`,
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
    const allSupportTypeItems: SelectItem[] = [];

    const certified = facets[facetsKeys[0]];
    certified?.forEach(certifiedBy => {
      allSupportTypeItems.push({
        label: `Certified by ${certifiedBy.value} (${certifiedBy.count})`,
        value: `${facetsKeys[0]}=${certifiedBy.value}`,
      });
    });

    const verified = facets[facetsKeys[1]];
    verified?.forEach(verifiedBy => {
      allSupportTypeItems.push({
        label: `Verified by ${verifiedBy.value} (${verifiedBy.count})`,
        value: `${facetsKeys[1]}=${verifiedBy.value}`,
      });
    });

    const preInstalled = facets[facetsKeys[2]];
    preInstalled?.forEach(preInstall => {
      if (preInstall.value === 'false') {
        allSupportTypeItems.push({
          label: `Custom plugins (${preInstall.count})`,
          value: `${facetsKeys[2]}=${preInstall.value}`,
        });
      }
    });

    const supportTypes = facets[facetsKeys[3]];
    supportTypes?.forEach(supportType => {
      allSupportTypeItems.push({
        label: `${supportType.value} (${supportType.count})`,
        value: `${facetsKeys[3]}=${supportType.value}`,
      });
    });

    return allSupportTypeItems;
  }, [facets]);

  const selected = useMemo(() => {
    const selectedFilters = searchParams
      .getAll('filter')
      .filter(filter =>
        filter.startsWith('metadata.annotations.extensions.backstage.io/'),
      );
    return items?.filter(item =>
      selectedFilters.includes(item.value.toString()),
    );
  }, [searchParams, items]);

  const onChange = useCallback(
    (newValues: SelectItem[]) => {
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
              value.startsWith(`metadata.annotations.extensions.backstage.io/`)
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
      label="Support type"
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
