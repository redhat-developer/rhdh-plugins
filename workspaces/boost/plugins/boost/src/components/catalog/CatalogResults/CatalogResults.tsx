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

import type { Entity } from '@backstage/catalog-model';
import { Grid, Flex, TablePagination, type SortState } from '@backstage/ui';

import { AiAssetCard } from '../AiAssetCard';
import { AiCatalogTable } from '../AiCatalogTable';
import { CatalogToolbar, type CatalogViewMode } from '../CatalogToolbar';
import { EmptyFilteredState } from './EmptyFilteredState';
import { CatalogEmptyState } from './CatalogEmptyState';
import { CatalogErrorState } from './CatalogErrorState';
import { CatalogLoadingState } from './CatalogLoadingState';
import styles from '../../../pages/AiCatalogPage.module.css';

interface CatalogResultsProps {
  readonly loading: boolean;
  readonly error: Error | undefined;
  readonly retry: () => void;
  readonly filtersCount: number;
  readonly cardCount: number;
  readonly allEntitiesCount: number;
  readonly hasActiveFilters: boolean;
  readonly entities: Entity[];
  readonly pageEntities: Entity[];
  readonly viewMode: CatalogViewMode;
  readonly sort: SortState;
  readonly pageSize: number;
  readonly pageStart: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
  readonly searchInputValue: string;
  readonly onSearchChange: (value: string) => void;
  readonly onClearFilters: () => void;
  readonly onViewModeChange: (value: CatalogViewMode) => void;
  readonly onNextPage: () => void;
  readonly onPreviousPage: () => void;
  readonly onPageSizeChange: (pageSize: number) => void;
}

export const CatalogResults = ({
  loading,
  error,
  retry,
  filtersCount,
  cardCount,
  allEntitiesCount,
  hasActiveFilters,
  entities,
  pageEntities,
  viewMode,
  sort,
  pageSize,
  pageStart,
  hasNextPage,
  hasPreviousPage,
  searchInputValue,
  onSearchChange,
  onClearFilters,
  onViewModeChange,
  onNextPage,
  onPreviousPage,
  onPageSizeChange,
}: CatalogResultsProps) => {
  if (loading) {
    return (
      <CatalogLoadingState filterCount={filtersCount} cardCount={cardCount} />
    );
  }

  if (error) return <CatalogErrorState onRetry={retry} />;

  if (allEntitiesCount === 0 && !hasActiveFilters) return <CatalogEmptyState />;

  const totalCount = entities.length;

  return (
    <section
      className={styles.resultsSurface}
      aria-labelledby="ai-catalog-results-title"
    >
      <CatalogToolbar
        totalCount={totalCount}
        hasActiveFilters={hasActiveFilters}
        searchInputValue={searchInputValue}
        viewMode={viewMode}
        onSearchChange={onSearchChange}
        onClearFilters={onClearFilters}
        onViewModeChange={onViewModeChange}
      />
      <div className={styles.resultsBody}>
        {totalCount === 0 && hasActiveFilters && (
          <EmptyFilteredState onClearFilters={onClearFilters} />
        )}

        {totalCount > 0 && viewMode === 'grid' && (
          <Grid.Root columns={{ initial: '1', sm: '2', lg: '4' }} gap="4">
            {pageEntities.map(entity => (
              <Grid.Item key={entity.metadata.uid ?? entity.metadata.name}>
                <AiAssetCard entity={entity} />
              </Grid.Item>
            ))}
          </Grid.Root>
        )}

        {totalCount > 0 && viewMode === 'table' && (
          <AiCatalogTable entities={pageEntities} sort={sort} />
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
            onNextPage={onNextPage}
            onPreviousPage={onPreviousPage}
            onPageSizeChange={onPageSizeChange}
          />
        </Flex>
      )}
    </section>
  );
};
