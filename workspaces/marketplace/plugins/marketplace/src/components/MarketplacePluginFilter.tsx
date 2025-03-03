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

import React from 'react';

import { Select, SelectItem } from '@backstage/core-components';
import { useSearchParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { MarketplaceAnnotation } from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import { usePluginFacet } from '../hooks/usePluginFacet';
import { usePluginFacets } from '../hooks/usePluginFacets';
import { BackstageSelectFilter } from '../shared-components/BackstageSelectFilter';

const CategoryFilter = () => {
  const categoriesFacet = usePluginFacet('spec.categories');
  const categories = categoriesFacet.data;

  const items = React.useMemo(() => {
    if (!categories) return [];
    return categories.map(category => ({
      label: category.value,
      value: category.value,
    }));
  }, [categories]);

  return (
    <BackstageSelectFilter
      label="Category"
      name="spec.categories"
      items={items}
      multiple
    />
  );
};

const AuthorFilter = () => {
  const authorsFacet = usePluginFacet('spec.authors.name');
  const authors = authorsFacet.data;

  const items = React.useMemo(() => {
    if (!authors) return [];
    return authors.map(author => ({
      label: author.value,
      value: author.value,
    }));
  }, [authors]);

  return (
    <BackstageSelectFilter
      label="Author"
      name="spec.authors.name"
      items={items}
      multiple
    />
  );
};

const facetsKeys = [
  `metadata.annotations.${MarketplaceAnnotation.CERTIFIED_BY}`,
  `metadata.annotations.${MarketplaceAnnotation.VERIFIED_BY}`,
  `metadata.annotations.${MarketplaceAnnotation.PRE_INSTALLED}`,
  `metadata.annotations.${MarketplaceAnnotation.SUPPORT_TYPE}`,
];

const SupportTypeFilter = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const pluginFacets = usePluginFacets({ facets: facetsKeys });

  const facets = pluginFacets.data;

  const items = React.useMemo(() => {
    if (!facets) return [];
    const allSupportTypeItems: SelectItem[] = [];

    const certified = facets[facetsKeys[0]];
    certified.forEach(certifiedBy => {
      allSupportTypeItems.push({
        label: `Certified by ${certifiedBy.value} (${certifiedBy.count})`,
        value: `${facetsKeys[0]}=${certifiedBy.value}`,
      });
    });

    const verified = facets[facetsKeys[1]];
    verified.forEach(verifiedBy => {
      allSupportTypeItems.push({
        label: `Verified by ${verifiedBy.value} (${verifiedBy.count})`,
        value: `${facetsKeys[1]}=${verifiedBy.value}`,
      });
    });

    const preInstalled = facets[facetsKeys[2]];
    preInstalled.forEach(preInstall => {
      if (preInstall.value === 'false') {
        allSupportTypeItems.push({
          label: `Custom plugins (${preInstall.count})`,
          value: `${facetsKeys[2]}=${preInstall.value}`,
        });
      }
    });

    const supportTypes = facets[facetsKeys[3]];
    supportTypes.forEach(supportType => {
      allSupportTypeItems.push({
        label: `${supportType.value} (${supportType.count})`,
        value: `${facetsKeys[3]}=${supportType.value}`,
      });
    });

    return allSupportTypeItems;
  }, [facets]);

  const selected = React.useMemo(() => {
    return searchParams
      .getAll('filter')
      .filter(filter =>
        filter.startsWith('metadata.annotations.marketplace.backstage.io/'),
      );
  }, [searchParams]);

  const onChange = React.useCallback(
    (newValue: string | string[] | number | number[]) => {
      setSearchParams(
        params => {
          const newParams = new URLSearchParams();

          let added = false;
          const add = () => {
            if (added) return;
            if (Array.isArray(newValue)) {
              newValue.forEach(v => newParams.append('filter', String(v)));
            } else {
              newParams.append('filter', String(newValue));
            }
            added = true;
          };

          // Try to keep the right position...
          params.forEach((value, key) => {
            if (
              key === 'filter' &&
              value.startsWith(`metadata.annotations.marketplace.backstage.io/`)
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
    <Box pb={1} pt={1}>
      <Select
        label="Support type"
        items={items}
        selected={selected}
        onChange={onChange}
        multiple
      />
    </Box>
  );
};

export const MarketplacePluginFilter = () => {
  return (
    <Box sx={{ minWidth: { xs: 200, lg: 'auto' } }}>
      <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
        <Typography variant="h4" sx={{ pb: 1 }}>
          Filters
        </Typography>
      </Box>
      <Divider />
      <CategoryFilter />
      <AuthorFilter />
      <SupportTypeFilter />
    </Box>
  );
};
