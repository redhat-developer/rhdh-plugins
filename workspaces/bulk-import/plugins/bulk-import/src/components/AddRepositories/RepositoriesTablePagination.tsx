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

import { TablePagination } from '@backstage/ui';

import { useTranslation } from '../../hooks/useTranslation';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100] as const;

const PAGE_SIZE_LABEL_KEYS: Record<
  (typeof PAGE_SIZE_OPTIONS)[number],
  | 'table.pagination.rows5'
  | 'table.pagination.rows10'
  | 'table.pagination.rows20'
  | 'table.pagination.rows50'
  | 'table.pagination.rows100'
> = {
  5: 'table.pagination.rows5',
  10: 'table.pagination.rows10',
  20: 'table.pagination.rows20',
  50: 'table.pagination.rows50',
  100: 'table.pagination.rows100',
};

export const RepositoriesTablePagination = ({
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
}) => {
  const { t } = useTranslation();
  const offset = page * rowsPerPage;
  const pageSizeOptions = PAGE_SIZE_OPTIONS.map(value => ({
    value,
    label: t(PAGE_SIZE_LABEL_KEYS[value]),
  }));

  return (
    <TablePagination
      pageSize={rowsPerPage}
      pageSizeOptions={pageSizeOptions}
      offset={offset}
      totalCount={count}
      hasNextPage={offset + rowsPerPage < count}
      hasPreviousPage={page > 0}
      onNextPage={() => onPageChange(page + 1)}
      onPreviousPage={() => onPageChange(page - 1)}
      onPageSizeChange={onRowsPerPageChange}
      showPageSizeOptions
    />
  );
};
