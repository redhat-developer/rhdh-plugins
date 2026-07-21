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

import { useCallback, useMemo, useState } from 'react';
import {
  Flex,
  Grid,
  SearchField,
  type SortDescriptor,
  TablePagination,
  Text,
  ToggleButton,
  ToggleButtonGroup,
} from '@backstage/ui';
import GridViewOutlined from '@mui/icons-material/GridViewOutlined';
import ViewListOutlined from '@mui/icons-material/ViewListOutlined';

import { useAiAssets } from '../../hooks/useAiAssets';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { useTranslation } from '../../hooks/useTranslation';
import { getSortValue } from '../../utils/entityHelpers';
import { AiAssetCard } from './AiAssetCard';
import { AiCatalogTable } from './AiCatalogTable';
import { EmptyFilteredState } from './EmptyFilteredState';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { LoadingState } from './LoadingState';
import { ErrorBoundary } from './ErrorBoundary';
import { FilterSidebar } from './FilterSidebar';
import styles from './AiCatalogPage.module.css';

const AiCatalogPageContent = () => {
  const { t } = useTranslation();
  const urlState = useUrlFilters();
  const {
    filters,
    searchInputValue,
    viewMode,
    page,
    pageSize,
    setSearch,
    setCategory,
    setViewMode,
    setPage,
    setPageSize,
    clearFilters,
  } = urlState;

  const {
    entities: filteredEntities,
    allEntities,
    loading,
    error,
    retry,
  } = useAiAssets(filters);

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor | null>(
    null,
  );
  const onSortChange = useCallback(
    (descriptor: SortDescriptor) => setSortDescriptor(descriptor),
    [],
  );
  const sortState = useMemo(
    () => ({ descriptor: sortDescriptor, onSortChange }),
    [sortDescriptor, onSortChange],
  );

  const sortedEntities = useMemo(() => {
    if (!sortDescriptor) return filteredEntities;
    const { column, direction } = sortDescriptor;
    const sorted = [...filteredEntities].sort((a, b) =>
      getSortValue(a, column as string).localeCompare(
        getSortValue(b, column as string),
      ),
    );
    return direction === 'descending' ? sorted.reverse() : sorted;
  }, [filteredEntities, sortDescriptor]);

  const totalCount = filteredEntities.length;
  const pageStart = page * pageSize;
  const pagedEntities = useMemo(
    () => sortedEntities.slice(pageStart, pageStart + pageSize),
    [sortedEntities, pageStart, pageSize],
  );

  const hasNextPage = pageStart + pageSize < totalCount;
  const hasPreviousPage = page > 0;
  const viewModeKeys = useMemo(() => new Set([viewMode]), [viewMode]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState onRetry={retry} />;

  const hasActiveFilters =
    filters.search ||
    filters.category?.length ||
    filters.provider?.length ||
    filters.tags?.length ||
    filters.owner?.length;

  if (allEntities.length === 0 && !hasActiveFilters) {
    return <EmptyState />;
  }

  return (
    <Flex gap="6" p="4" align="start" className={styles.layout}>
      <FilterSidebar
        entities={allEntities}
        state={{ filters }}
        actions={urlState}
      />
      <Flex direction="column" grow={1} className={styles.content}>
        <Flex align="center" justify="between" gap="4" mb="4">
          <Text variant="title-small">
            {`${t('catalog.toolbar.allPrefix')} (${totalCount})`}
          </Text>
          <Flex align="center" gap="3">
            <SearchField
              aria-label={t('catalog.toolbar.search')}
              placeholder={t('catalog.toolbar.search')}
              value={searchInputValue}
              onChange={setSearch}
              size="small"
            />
            <ToggleButtonGroup
              selectionMode="single"
              selectedKeys={viewModeKeys}
              onSelectionChange={keys => {
                const selected = [...keys][0] as string | undefined;
                if (selected === 'grid' || selected === 'table') {
                  setViewMode(selected);
                }
              }}
              disallowEmptySelection
            >
              <ToggleButton
                id="grid"
                aria-label={t('catalog.toolbar.viewGrid')}
                iconStart={<GridViewOutlined fontSize="small" />}
              />
              <ToggleButton
                id="table"
                aria-label={t('catalog.toolbar.viewTable')}
                iconStart={<ViewListOutlined fontSize="small" />}
              />
            </ToggleButtonGroup>
          </Flex>
        </Flex>

        {totalCount === 0 && hasActiveFilters && (
          <EmptyFilteredState onClearFilters={clearFilters} />
        )}

        {totalCount > 0 && viewMode === 'grid' && (
          <Grid.Root columns={{ initial: '1', sm: '2', lg: '4' }} gap="4">
            {pagedEntities.map(entity => (
              <Grid.Item key={entity.metadata.uid ?? entity.metadata.name}>
                <AiAssetCard
                  entity={entity}
                  onCategoryClick={cat => setCategory([cat])}
                />
              </Grid.Item>
            ))}
          </Grid.Root>
        )}

        {totalCount > 0 && viewMode === 'table' && (
          <AiCatalogTable entities={pagedEntities} sort={sortState} />
        )}

        {totalCount > 0 && (
          <Flex justify="end" mt="4">
            <TablePagination
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 50]}
              offset={pageStart}
              totalCount={totalCount}
              hasNextPage={hasNextPage}
              hasPreviousPage={hasPreviousPage}
              onNextPage={() => setPage(page + 1)}
              onPreviousPage={() => setPage(page - 1)}
              onPageSizeChange={setPageSize}
            />
          </Flex>
        )}
      </Flex>
    </Flex>
  );
};

export const AiCatalogPage = () => {
  const { t } = useTranslation();
  return (
    <ErrorBoundary
      title={t('catalog.error.title')}
      retryLabel={t('catalog.error.retry')}
    >
      <AiCatalogPageContent />
    </ErrorBoundary>
  );
};
