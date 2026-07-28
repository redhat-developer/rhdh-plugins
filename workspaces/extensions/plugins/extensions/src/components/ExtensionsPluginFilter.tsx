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

import { useMemo, useCallback, type SyntheticEvent } from 'react';

import { useSearchParams } from 'react-router-dom';

import Box from '@mui/material/Box';

import { useFilteredPluginFacet } from '../hooks/useFilteredPluginFacet';
import { useFilteredSupportTypes } from '../hooks/useFilteredSupportTypes';
import {
  CustomSelectFilter,
  CustomSelectItem,
} from '../shared-components/CustomSelectFilter';
import { useQueryArrayFilter } from '../hooks/useQueryArrayFilter';
import { useTranslation } from '../hooks/useTranslation';
import {
  useCatalogSourceConfig,
  getCatalogSourceLabel,
} from '../hooks/useCatalogSourceConfig';

const CategoryFilter = () => {
  const { t } = useTranslation();
  const categoriesFacet = useFilteredPluginFacet('spec.categories', 'category');
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
    (_e: SyntheticEvent, value: CustomSelectItem[]) => {
      const newSelection = value.map(v => v.value);
      filter.set(newSelection);
    },
    [filter],
  );

  return (
    <CustomSelectFilter
      label={t('search.category')}
      items={items}
      onChange={handleChange}
      selectedItems={filter.current}
    />
  );
};

const AuthorFilter = () => {
  const { t } = useTranslation();
  const authorsFacet = useFilteredPluginFacet('spec.authors.name', 'author');
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
    (_e: SyntheticEvent, value: CustomSelectItem[]) => {
      const newSelection = value.map(v => v.value);
      filter.set(newSelection);
    },
    [filter],
  );

  return (
    <CustomSelectFilter
      label={t('search.author')}
      items={items}
      onChange={handleChange}
      selectedItems={filter.current}
    />
  );
};

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
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const filteredSupportTypes = useFilteredSupportTypes();

  const items = filteredSupportTypes.data;

  const selected = useMemo(() => {
    const selectedFilters = searchParams.getAll('filter');
    return items.filter(item => {
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
              (value === `custom` || value.startsWith('support-level='))
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
      label={t('search.supportType')}
      items={items}
      onChange={(_e, value) => onChange(value)}
      selectedItems={selected}
    />
  );
};

const CatalogSourceFilter = () => {
  const { t } = useTranslation();
  const sourcesConfig = useCatalogSourceConfig();
  const catalogSourceFacet = useFilteredPluginFacet(
    'metadata.annotations.catalog-source',
    'catalog-source',
  );
  const filter = useQueryArrayFilter('catalog-source');
  const sources = catalogSourceFacet.data;

  const items = useMemo(() => {
    if (!sources) return [];
    return sources.map(source => ({
      label: getCatalogSourceLabel(source.value, sourcesConfig),
      value: source.value,
      count: source.count,
      helperText: sourcesConfig[source.value]?.description,
    }));
  }, [sources, sourcesConfig]);

  const handleChange = useCallback(
    (_e: SyntheticEvent, value: CustomSelectItem[]) => {
      const newSelection = value.map(v => v.value);
      filter.set(newSelection);
    },
    [filter],
  );

  if (items.length === 0) return null;

  return (
    <CustomSelectFilter
      label={t('search.catalogSource')}
      items={items}
      onChange={handleChange}
      selectedItems={filter.current}
    />
  );
};

export const ExtensionsPluginFilter = () => {
  return (
    <Box sx={{ minWidth: { xs: 200, lg: 'auto' } }}>
      <CategoryFilter />
      <AuthorFilter />
      <CatalogSourceFilter />
      <SupportTypeFilter />
    </Box>
  );
};
