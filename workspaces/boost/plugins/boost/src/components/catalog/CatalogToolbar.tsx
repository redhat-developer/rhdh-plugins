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

import {
  Button,
  Flex,
  SearchField,
  Text,
  ToggleButton,
  ToggleButtonGroup,
} from '@backstage/ui';
import { RiGridLine, RiListUnordered } from '@remixicon/react';

import type { CatalogViewMode } from '../../hooks/useUrlFilters';
import { useTranslation } from '../../hooks/useTranslation';
import styles from './CatalogToolbar.module.css';

interface CatalogToolbarProps {
  readonly totalCount: number;
  readonly hasActiveFilters: boolean;
  readonly searchInputValue: string;
  readonly viewMode: CatalogViewMode;
  readonly onSearchChange: (value: string) => void;
  readonly onClearFilters: () => void;
  readonly onViewModeChange: (value: CatalogViewMode) => void;
}

export const CatalogToolbar = ({
  totalCount,
  hasActiveFilters,
  searchInputValue,
  viewMode,
  onSearchChange,
  onClearFilters,
  onViewModeChange,
}: CatalogToolbarProps) => {
  const { t } = useTranslation();
  const viewModeKeys = new Set([viewMode]);

  return (
    <Flex align="center" justify="between" gap="4" className={styles.toolbar}>
      <Text
        id="ai-catalog-results-title"
        variant="title-small"
        className={styles.resultCount}
      >
        {`${t('catalog.toolbar.allPrefix')} (${totalCount})`}
      </Text>
      <Flex align="center" gap="3" className={styles.toolbarActions}>
        {hasActiveFilters && (
          <Button variant="tertiary" size="small" onPress={onClearFilters}>
            {t('catalog.filter.clearAll')}
          </Button>
        )}
        <SearchField
          className={styles.search}
          aria-label={t('catalog.toolbar.search')}
          placeholder={t('catalog.toolbar.search')}
          value={searchInputValue}
          onChange={onSearchChange}
          size="small"
        />
        <ToggleButtonGroup
          className={styles.viewToggle}
          selectionMode="single"
          selectedKeys={viewModeKeys}
          onSelectionChange={keys => {
            const selected = [...keys][0];
            if (selected === 'grid' || selected === 'table') {
              onViewModeChange(selected);
            }
          }}
          disallowEmptySelection
        >
          <ToggleButton
            id="grid"
            aria-label={t('catalog.toolbar.viewGrid')}
            iconStart={<RiGridLine size={16} />}
          />
          <ToggleButton
            id="table"
            aria-label={t('catalog.toolbar.viewTable')}
            iconStart={<RiListUnordered size={16} />}
          />
        </ToggleButtonGroup>
      </Flex>
    </Flex>
  );
};
