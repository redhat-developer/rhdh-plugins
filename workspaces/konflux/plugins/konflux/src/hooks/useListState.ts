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

import { FRONTEND_PAGINATION } from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { useEffect, useMemo, useState } from 'react';

export interface UseListStateOptions {
  initialPage?: number;
  initialRowsPerPage?: number;
}

export interface UseListStateReturn {
  page: number;
  setPage: (page: number) => void;
  rowsPerPage: number;
  setRowsPerPage: (rowsPerPage: number) => void;
}

/**
 * Manages pagination state for list components
 *
 * @param options - Initial state configuration
 * @returns State and setters for pagination
 */
export const useListState = (
  options: UseListStateOptions = {},
): UseListStateReturn => {
  const {
    initialPage = FRONTEND_PAGINATION.DEFAULT_PAGE,
    initialRowsPerPage = FRONTEND_PAGINATION.DEFAULT_ROWS_PER_PAGE,
  } = options;

  const [page, setPage] = useState(initialPage);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  return {
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
  };
};

/**
 * Hook to reset page to 0 when filters change
 * Usage: useResetPageOnFilterChange(setPage, [filter1, filter2, ...])
 *
 * @param setPage - Function to set the page
 * @param filters - Array of filter values to watch for changes
 */
export const useResetPageOnFilterChange = (
  setPage: (page: number) => void,
  filters: string[],
): void => {
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    setPage(FRONTEND_PAGINATION.DEFAULT_PAGE);
  }, [setPage, filtersKey]);
};
