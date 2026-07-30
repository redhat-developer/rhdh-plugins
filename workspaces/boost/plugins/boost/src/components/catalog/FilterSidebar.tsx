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

import { useMemo } from 'react';
import type { Entity } from '@backstage/catalog-model';
import { Select } from '@backstage/ui';

import type { FilterDefinition } from '../../blueprints/AiCatalogFilterBlueprint';
import { useTranslation } from '../../hooks/useTranslation';
import styles from './FilterSidebar.module.css';

type TranslationKey = Parameters<ReturnType<typeof useTranslation>['t']>[0];

interface FilterSidebarProps {
  filters: FilterDefinition[];
  entities: Entity[];
  values: Map<string, string[]>;
  onFilterChange: (urlParam: string, values: string[]) => void;
}

function FilterSelect({
  filter,
  entities,
  selected,
  onChange,
}: {
  filter: FilterDefinition;
  entities: Entity[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const { t } = useTranslation();
  const label = filter.labelKey
    ? t(filter.labelKey as TranslationKey)
    : filter.label;
  const options = useMemo(
    () => filter.getOptions(entities),
    [filter, entities],
  );

  return (
    <Select
      label={label}
      selectionMode="multiple"
      options={options}
      value={selected}
      onChange={keys => onChange(keys as string[])}
    />
  );
}

export const FilterSidebar = ({
  filters,
  entities,
  values,
  onFilterChange,
}: FilterSidebarProps) => {
  const { t } = useTranslation();

  if (filters.length === 0) return null;

  return (
    <nav className={styles.sidebar} aria-label={t('catalog.page.title')}>
      {filters.map(filter => (
        <FilterSelect
          key={filter.urlParam}
          filter={filter}
          entities={entities}
          selected={values.get(filter.urlParam) ?? []}
          onChange={vals => onFilterChange(filter.urlParam, vals)}
        />
      ))}
    </nav>
  );
};
