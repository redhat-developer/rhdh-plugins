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

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Button,
  Flex,
  Grid,
  SearchField,
  type SortDescriptor,
  TablePagination,
  Text,
  ToggleButton,
  ToggleButtonGroup,
} from '@backstage/ui';
import { RiGridLine, RiListUnordered } from '@remixicon/react';

import type { FilterDefinition } from '../../blueprints/AiCatalogFilterBlueprint';
import { useAiAssets } from '../../hooks/useAiAssets';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { useTranslation } from '../../hooks/useTranslation';
import { getSortValue } from '../../utils/entityHelpers';
import { AiAssetCard } from './AiAssetCard';
import { AiCatalogTable } from './AiCatalogTable';
import { EmptyFilteredState } from './EmptyFilteredState';
import { EmptyState } from './EmptyState';
import { ErrorBoundary } from './ErrorBoundary';
import { ErrorState } from './ErrorState';
import { FilterDrawer } from './FilterDrawer';
import { FilterSidebar } from './FilterSidebar';
import { LoadingState } from './LoadingState';
import styles from './AiCatalogPage.module.css';

interface AiCatalogPageProps {
  filters: FilterDefinition[];
}

const CatalogPageSurface = ({ children }: { children: ReactNode }) => {
  return <div className={styles.page}>{children}</div>;
};

const AiCatalogPageContent = ({ filters }: AiCatalogPageProps) => {
  const { t } = useTranslation();

  const filterParams = useMemo(() => filters.map(f => f.urlParam), [filters]);
  const urlState = useUrlFilters(filterParams);
  const {
    search,
    searchInputValue,
    filterValues,
    viewMode,
    page,
    pageSize,
    setSearch,
    setFilter,
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
  } = useAiAssets(search || undefined, filters, filterValues);

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor | null>(
    null,
  );
  const sortState = useMemo(
    () => ({ descriptor: sortDescriptor, onSortChange: setSortDescriptor }),
    [sortDescriptor],
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

  useEffect(() => {
    if (!loading && !error && page > 0 && pageStart >= totalCount) {
      setPage(0, { replace: true });
    }
  }, [error, loading, page, pageStart, setPage, totalCount]);

  if (loading) {
    return (
      <CatalogPageSurface>
        <LoadingState
          filterCount={filters.length}
          cardCount={Math.min(pageSize, 8)}
        />
      </CatalogPageSurface>
    );
  }
  if (error) {
    return (
      <CatalogPageSurface>
        <ErrorState onRetry={retry} />
      </CatalogPageSurface>
    );
  }

  const hasActiveFilters = Boolean(search) || filterValues.size > 0;

  if (allEntities.length === 0 && !hasActiveFilters) {
    return (
      <CatalogPageSurface>
        <EmptyState />
      </CatalogPageSurface>
    );
  }

  return (
    <CatalogPageSurface>
      <div className={styles.layout}>
        <div className={styles.desktopFilters}>
          <FilterSidebar
            filters={filters}
            entities={allEntities}
            values={filterValues}
            onFilterChange={setFilter}
          />
        </div>
        <main className={styles.content}>
          <div className={styles.mobileFilterTrigger}>
            <FilterDrawer
              filters={filters}
              entities={allEntities}
              values={filterValues}
              onFilterChange={setFilter}
            />
          </div>
          <section
            className={styles.resultsSurface}
            aria-labelledby="ai-catalog-results-title"
          >
            <Flex
              align="center"
              justify="between"
              gap="4"
              className={styles.toolbar}
            >
              <Text
                id="ai-catalog-results-title"
                variant="title-small"
                className={styles.resultCount}
              >
                {`${t('catalog.toolbar.allPrefix')} (${totalCount})`}
              </Text>
              <Flex align="center" gap="3" className={styles.toolbarActions}>
                {hasActiveFilters && (
                  <Button
                    variant="tertiary"
                    size="small"
                    onPress={clearFilters}
                  >
                    {t('catalog.filter.clearAll')}
                  </Button>
                )}
                <SearchField
                  className={styles.search}
                  aria-label={t('catalog.toolbar.search')}
                  placeholder={t('catalog.toolbar.search')}
                  value={searchInputValue}
                  onChange={setSearch}
                  size="small"
                />
                <ToggleButtonGroup
                  className={styles.viewToggle}
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

            <div className={styles.resultsBody}>
              {totalCount === 0 && hasActiveFilters && (
                <EmptyFilteredState onClearFilters={clearFilters} />
              )}

              {totalCount > 0 && viewMode === 'grid' && (
                <Grid.Root columns={{ initial: '1', sm: '2', lg: '4' }} gap="4">
                  {pagedEntities.map(entity => (
                    <Grid.Item
                      key={entity.metadata.uid ?? entity.metadata.name}
                    >
                      <AiAssetCard entity={entity} />
                    </Grid.Item>
                  ))}
                </Grid.Root>
              )}

              {totalCount > 0 && viewMode === 'table' && (
                <AiCatalogTable entities={pagedEntities} sort={sortState} />
              )}
            </div>

            {totalCount > 0 && (
              <Flex justify="end" className={styles.pagination}>
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
          </section>
        </main>
      </div>
    </CatalogPageSurface>
  );
};

export const AiCatalogPage = ({ filters }: AiCatalogPageProps) => {
  const { t } = useTranslation();
  return (
    <ErrorBoundary
      title={t('catalog.error.title')}
      retryLabel={t('catalog.error.retry')}
    >
      <AiCatalogPageContent filters={filters} />
    </ErrorBoundary>
  );
};
