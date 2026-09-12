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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export type ViewMode = 'grid' | 'table';

export interface UrlFilterState {
  search: string;
  searchInputValue: string;
  filterValues: Map<string, string[]>;
  viewMode: ViewMode;
  page: number;
  pageSize: number;
}

export interface UrlFilterActions {
  setSearch: (value: string) => void;
  setFilter: (urlParam: string, values: string[]) => void;
  setViewMode: (mode: ViewMode) => void;
  setPage: (page: number, options?: { replace?: boolean }) => void;
  setPageSize: (size: number) => void;
  clearFilters: () => void;
}

function readArray(params: URLSearchParams, key: string): string[] {
  const val = params.get(key);
  return val ? val.split(',').filter(Boolean) : [];
}

function buildFilterKey(
  filterParams: string[],
  searchParams: URLSearchParams,
): string {
  const filterSnapshot = new URLSearchParams();
  for (const param of filterParams) {
    filterSnapshot.set(param, searchParams.get(param) ?? '');
  }
  return filterSnapshot.toString();
}

function readFilterValues(filterKey: string): Map<string, string[]> {
  const filterSnapshot = new URLSearchParams(filterKey);
  const values = new Map<string, string[]>();

  for (const [param] of filterSnapshot) {
    const selected = readArray(filterSnapshot, param);
    if (selected.length > 0) {
      values.set(param, selected);
    }
  }

  return values;
}

const SEARCH_DEBOUNCE_MS = 300;
const DEFAULT_PAGE_SIZE = 20;
const ALLOWED_PAGE_SIZES = new Set([10, 20, 50]);

function parseNonNegativeInteger(value: string | null): number | undefined {
  if (value === null || !/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}

/**
 * Synchronizes filter, search, pagination, and view mode state
 * with URL query parameters. Accepts dynamic filter param names
 * from the registered FilterDefinition set.
 */
export function useUrlFilters(
  filterParams: string[],
): UrlFilterState & UrlFilterActions {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawSearch = searchParams.get('q') ?? '';
  const rawView = searchParams.get('view');
  const viewMode: ViewMode = rawView === 'table' ? 'table' : 'grid';
  const rawPage = searchParams.get('page');
  const parsedPage = parseNonNegativeInteger(rawPage);
  const page = parsedPage ?? 0;
  const rawPageSize = searchParams.get('pageSize');
  const parsedPageSize = parseNonNegativeInteger(rawPageSize);
  const pageSize =
    parsedPageSize !== undefined && ALLOWED_PAGE_SIZES.has(parsedPageSize)
      ? parsedPageSize
      : DEFAULT_PAGE_SIZE;

  const invalidView =
    rawView !== null && rawView !== 'grid' && rawView !== 'table';
  const invalidPage = rawPage !== null && parsedPage === undefined;
  const invalidPageSize =
    rawPageSize !== null &&
    (parsedPageSize === undefined || !ALLOWED_PAGE_SIZES.has(parsedPageSize));

  useEffect(() => {
    if (!invalidView && !invalidPage && !invalidPageSize) return;
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev);
        if (invalidView) next.delete('view');
        if (invalidPage) next.delete('page');
        if (invalidPageSize) next.delete('pageSize');
        return next;
      },
      { replace: true },
    );
  }, [invalidPage, invalidPageSize, invalidView, setSearchParams]);

  // Keep filterValues stable when unrelated URL state changes. Include both
  // names and values so changing the dynamic filter set cannot reuse a stale
  // map when two filters happen to have the same selected value.
  const filterKey = buildFilterKey(filterParams, searchParams);
  const filterValues = useMemo(() => readFilterValues(filterKey), [filterKey]);

  const [searchInputValue, setSearchInputValue] = useState(rawSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(rawSearch);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const lastWrittenSearchRef = useRef(rawSearch);

  useEffect(() => {
    if (rawSearch !== lastWrittenSearchRef.current) {
      lastWrittenSearchRef.current = rawSearch;
      setSearchInputValue(rawSearch);
      setDebouncedSearch(rawSearch);
    }
  }, [rawSearch]);

  useEffect(() => {
    if (searchInputValue === lastWrittenSearchRef.current) {
      return undefined;
    }
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(searchInputValue);
      lastWrittenSearchRef.current = searchInputValue;
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (searchInputValue) {
          next.set('q', searchInputValue);
        } else {
          next.delete('q');
        }
        next.delete('page');
        return next;
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
  }, [searchInputValue, setSearchParams]);

  const setSearch = useCallback((value: string) => {
    setSearchInputValue(value);
  }, []);

  const setFilter = useCallback(
    (urlParam: string, values: string[]) => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (values.length > 0) {
          next.set(urlParam, values.join(','));
        } else {
          next.delete(urlParam);
        }
        next.delete('page');
        return next;
      });
    },
    [setSearchParams],
  );

  const setViewMode = useCallback(
    (mode: ViewMode) => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (mode === 'grid') {
          next.delete('view');
        } else {
          next.set('view', mode);
        }
        return next;
      });
    },
    [setSearchParams],
  );

  const setPage = useCallback(
    (p: number, options?: { replace?: boolean }) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          if (p <= 0) {
            next.delete('page');
          } else {
            next.set('page', String(p));
          }
          return next;
        },
        { replace: options?.replace },
      );
    },
    [setSearchParams],
  );

  const setPageSize = useCallback(
    (size: number) => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.set('pageSize', String(size));
        next.delete('page');
        return next;
      });
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(() => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('q');
      next.delete('page');
      for (const param of filterParams) {
        next.delete(param);
      }
      return next;
    });
    setSearchInputValue('');
    setDebouncedSearch('');
  }, [setSearchParams, filterParams]);

  return {
    search: debouncedSearch,
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
  };
}
