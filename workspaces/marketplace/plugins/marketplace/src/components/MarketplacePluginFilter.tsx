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

import Divider from '@mui/material/Divider';

import { usePluginFacet } from '../hooks/usePluginFacet';
import { BackstageSelectFilter } from '../shared-components/BackstageSelectFilter';

const CategoryFilter = () => {
  const categoriesFacet = usePluginFacet('spec.categories');
  const categories = categoriesFacet.data?.facets['spec.categories'];

  const items = React.useMemo(() => {
    if (!categories) return [];
    return categories.map((category) => ({
      label: category.value,
      value: category.value,
    }));
  }, [categories]);

  return (
    <BackstageSelectFilter
      label="Category"
      name="category"
      items={items}
      multiple
    />
  )
}

const AuthorFilter = () => {
  const authorsFacet = usePluginFacet('spec.author');
  const authors = authorsFacet.data?.facets['spec.author'];

  const items = React.useMemo(() => {
    if (!authors) return [];
    return authors.map((category) => ({
      label: category.value,
      value: category.value,
    }));
  }, [authors]);

  return (
    <BackstageSelectFilter
      label="Author"
      name="author"
      items={items}
      multiple
    />
  )
}

const SupportTypeFilter = () => {
  const categoriesFacet = usePluginFacet('spec.categories');
  const categories = categoriesFacet.data?.facets['spec.categories'];

  const items = React.useMemo(() => {
    if (!categories) return [];
    return categories.map((category) => ({
      label: category.value,
      value: category.value,
    }));
  }, [categories]);

  return (
    <BackstageSelectFilter
      label="Support type"
      name="support.type"
      items={items}
      multiple
    />
  )
}

export const MarketplacePluginFilter = () => {
  return (
    <div>
      <h2>Filters</h2>
      <Divider />
      <CategoryFilter />
      <AuthorFilter />
      <SupportTypeFilter />
    </div>
  );
};
