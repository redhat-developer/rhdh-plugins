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
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  clearFilters: () => void;
}

function readArray(params: URLSearchParams, key: string): string[] {
  const val = params.get(key);
  return val ? val.split(',').filter(Boolean) : [];
}

const SEARCH_DEBOUNCE_MS = 300;

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
  const viewMode = (searchParams.get('view') as ViewMode) || 'grid';
  const page = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10) || 0);
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10) || 20),
  );

  // Derived key that changes only when filter-relevant URL params change,
  // not on pagination or view mode changes.
  const filterKey = filterParams.map(p => searchParams.get(p) ?? '').join('\0');

  const filterValues = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const param of filterParams) {
      const vals = readArray(searchParams, param);
      if (vals.length > 0) {
        map.set(param, vals);
      }
    }
    return map;
    // searchParams and filterParams are used inside the memo but intentionally excluded from deps.
    // filterKey is derived from searchParams and filterParams, it stays stable when unrelated params change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

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
    (p: number) => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (p === 0) {
          next.delete('page');
        } else {
          next.set('page', String(p));
        }
        return next;
      });
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
