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
import { Header } from '@backstage/core-components';
import type { SortDescriptor } from '@backstage/ui';

import { CatalogErrorBoundary } from '../components/catalog/CatalogErrorBoundary';
import { CatalogFilters } from '../components/catalog/CatalogFilters/CatalogFilters';
import { FilterDrawer } from '../components/catalog/CatalogFilters/FilterDrawer';
import { CatalogEmptyState } from '../components/catalog/CatalogResults/CatalogEmptyState';
import { CatalogErrorState } from '../components/catalog/CatalogResults/CatalogErrorState';
import { CatalogLoadingState } from '../components/catalog/CatalogResults/CatalogLoadingState';
import { CatalogResults } from '../components/catalog/CatalogResults/CatalogResults';
import type { FilterDefinition } from '../blueprints/AiCatalogFilterBlueprint';
import { useAiAssets } from '../hooks/useAiAssets';
import { useUrlFilters } from '../hooks/useUrlFilters';
import { useTranslation } from '../hooks/useTranslation';
import { getSortValue } from '../utils/entityFiltering';
import styles from './AiCatalogPage.module.css';

interface AiCatalogPageProps {
  readonly filters: FilterDefinition[];
}

const CatalogPageSurface = ({ children }: { readonly children: ReactNode }) => (
  <div className={styles.page}>{children}</div>
);

const AiCatalogPageContent = ({ filters }: AiCatalogPageProps) => {
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
  const { entities, allEntities, loading, error, retry } = useAiAssets(
    search || undefined,
    filters,
    filterValues,
  );

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor | null>(
    null,
  );
  const sortState = useMemo(
    () => ({ descriptor: sortDescriptor, onSortChange: setSortDescriptor }),
    [sortDescriptor],
  );

  const sortedEntities = useMemo(() => {
    if (!sortDescriptor) return entities;
    const { column, direction } = sortDescriptor;
    const sorted = [...entities].sort((a, b) =>
      getSortValue(a, column as string).localeCompare(
        getSortValue(b, column as string),
      ),
    );
    return direction === 'descending' ? sorted.reverse() : sorted;
  }, [entities, sortDescriptor]);

  const totalCount = entities.length;
  const pageStart = page * pageSize;
  const pageEntities = useMemo(
    () => sortedEntities.slice(pageStart, pageStart + pageSize),
    [sortedEntities, pageStart, pageSize],
  );
  const hasNextPage = pageStart + pageSize < totalCount;
  const hasPreviousPage = page > 0;
  const hasActiveFilters = Boolean(search) || filterValues.size > 0;

  useEffect(() => {
    if (!loading && !error && page > 0 && pageStart >= totalCount) {
      setPage(0, { replace: true });
    }
  }, [error, loading, page, pageStart, setPage, totalCount]);

  if (loading) {
    return (
      <CatalogPageSurface>
        <div className={styles.layout}>
          <CatalogLoadingState
            filterCount={filters.length}
            cardCount={Math.min(pageSize, 8)}
          />
        </div>
      </CatalogPageSurface>
    );
  }

  if (error) {
    return (
      <CatalogPageSurface>
        <CatalogErrorState onRetry={retry} />
      </CatalogPageSurface>
    );
  }

  if (allEntities.length === 0 && !hasActiveFilters) {
    return (
      <CatalogPageSurface>
        <CatalogEmptyState onRefresh={retry} />
      </CatalogPageSurface>
    );
  }

  return (
    <CatalogPageSurface>
      <div className={styles.layout}>
        <div className={styles.desktopFilters}>
          <CatalogFilters
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
          <CatalogResults
            hasActiveFilters={hasActiveFilters}
            entities={entities}
            pageEntities={pageEntities}
            viewMode={viewMode}
            sort={sortState}
            pageSize={pageSize}
            pageStart={pageStart}
            hasNextPage={hasNextPage}
            hasPreviousPage={hasPreviousPage}
            searchInputValue={searchInputValue}
            onSearchChange={setSearch}
            onClearFilters={clearFilters}
            onViewModeChange={setViewMode}
            onNextPage={() => setPage(page + 1)}
            onPreviousPage={() => setPage(page - 1)}
            onPageSizeChange={setPageSize}
          />
        </main>
      </div>
    </CatalogPageSurface>
  );
};

export const AiCatalogPage = ({ filters }: AiCatalogPageProps) => {
  const { t } = useTranslation();

  return (
    <CatalogErrorBoundary
      title={t('catalog.error.title')}
      retryLabel={t('catalog.error.retry')}
    >
      <Header title={t('catalog.page.title')} />
      <AiCatalogPageContent filters={filters} />
    </CatalogErrorBoundary>
  );
};
