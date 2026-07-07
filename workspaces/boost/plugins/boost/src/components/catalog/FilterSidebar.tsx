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

import { useCallback, useMemo } from 'react';
import type { Entity } from '@backstage/catalog-model';
import { Select } from '@backstage/ui';
import type { Key } from 'react-aria-components';

import { useTranslation } from '../../hooks/useTranslation';
import { getAllCategories } from '../../utils/categoryMeta';
import { getSpecField } from '../../utils/entityHelpers';
import type {
  UrlFilterActions,
  UrlFilterState,
} from '../../hooks/useUrlFilters';
import styles from './FilterSidebar.module.css';

interface FilterSidebarProps {
  entities: Entity[];
  state: Pick<UrlFilterState, 'filters'>;
  actions: Pick<
    UrlFilterActions,
    'setCategory' | 'setProvider' | 'setOwner' | 'setTag'
  >;
}

function uniqueOptions(
  items: (string | undefined)[],
): { id: string; label: string }[] {
  const set = new Set<string>();
  for (const item of items) {
    if (item) set.add(item);
  }
  return Array.from(set)
    .sort()
    .map(v => ({ id: v, label: v }));
}

export const FilterSidebar = ({
  entities,
  state,
  actions: { setCategory, setProvider, setOwner, setTag },
}: FilterSidebarProps) => {
  const { t } = useTranslation();

  const categoryOptions = useMemo(() => getAllCategories(), []);

  const providerOptions = useMemo(
    () =>
      uniqueOptions(
        entities.map(e => e.metadata.annotations?.['rhdh.io/ai-asset-source']),
      ),
    [entities],
  );

  const ownerOptions = useMemo(
    () => uniqueOptions(entities.map(e => getSpecField(e, 'owner'))),
    [entities],
  );

  const tagOptions = useMemo(
    () => uniqueOptions(entities.flatMap(e => e.metadata.tags ?? [])),
    [entities],
  );

  const onCategoryChange = useCallback(
    (value: Key[]) => setCategory(value as string[]),
    [setCategory],
  );
  const onProviderChange = useCallback(
    (value: Key[]) => setProvider(value as string[]),
    [setProvider],
  );
  const onOwnerChange = useCallback(
    (value: Key[]) => setOwner(value as string[]),
    [setOwner],
  );
  const onTagChange = useCallback(
    (value: Key[]) => setTag(value as string[]),
    [setTag],
  );

  return (
    <nav className={styles.sidebar} aria-label={t('catalog.page.title')}>
      <Select
        label={t('catalog.filter.type')}
        selectionMode="multiple"
        options={categoryOptions}
        value={state.filters.category ?? []}
        onChange={onCategoryChange}
      />
      <Select
        label={t('catalog.filter.provider')}
        selectionMode="multiple"
        options={providerOptions}
        value={state.filters.provider ?? []}
        onChange={onProviderChange}
      />
      <Select
        label={t('catalog.filter.owner')}
        selectionMode="multiple"
        options={ownerOptions}
        value={state.filters.owner ?? []}
        onChange={onOwnerChange}
      />
      <Select
        label={t('catalog.filter.tag')}
        selectionMode="multiple"
        options={tagOptions}
        value={state.filters.tags ?? []}
        onChange={onTagChange}
      />
    </nav>
  );
};
