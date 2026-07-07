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

import type { AiAssetFilters } from './useAiAssets';

export type ViewMode = 'grid' | 'table';

export interface UrlFilterState {
  /** Debounced filters passed to useAiAssets. */
  filters: AiAssetFilters;
  /** Current search input value (not debounced) — bind to SearchField. */
  searchInputValue: string;
  viewMode: ViewMode;
  page: number;
  pageSize: number;
}

export interface UrlFilterActions {
  setSearch: (value: string) => void;
  setCategory: (values: string[]) => void;
  setProvider: (values: string[]) => void;
  setOwner: (values: string[]) => void;
  setTag: (values: string[]) => void;
  setViewMode: (mode: ViewMode) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  clearFilters: () => void;
}

function readArray(params: URLSearchParams, key: string): string[] {
  const val = params.get(key);
  return val ? val.split(',').filter(Boolean) : [];
}

function writeArray(
  params: URLSearchParams,
  key: string,
  values: string[],
): void {
  if (values.length > 0) {
    params.set(key, values.join(','));
  } else {
    params.delete(key);
  }
}

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Synchronizes filter, search, pagination, and view mode state
 * with URL query parameters. Search is debounced at 300ms so
 * the SearchField responds instantly while the data query
 * waits for the user to stop typing.
 */
export function useUrlFilters(): UrlFilterState & UrlFilterActions {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawSearch = searchParams.get('q') ?? '';
  const category = useMemo(
    () => readArray(searchParams, 'type'),
    [searchParams],
  );
  const provider = useMemo(
    () => readArray(searchParams, 'provider'),
    [searchParams],
  );
  const owner = useMemo(() => readArray(searchParams, 'owner'), [searchParams]);
  const tag = useMemo(() => readArray(searchParams, 'tag'), [searchParams]);
  const viewMode = (searchParams.get('view') as ViewMode) || 'grid';
  const page = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10) || 0);
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10) || 20),
  );

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

  const update = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        updater(next);
        return next;
      });
    },
    [setSearchParams],
  );

  const setSearch = useCallback((value: string) => {
    setSearchInputValue(value);
  }, []);

  const setCategory = useCallback(
    (values: string[]) =>
      update(p => {
        writeArray(p, 'type', values);
        p.delete('page');
      }),
    [update],
  );

  const setProvider = useCallback(
    (values: string[]) =>
      update(p => {
        writeArray(p, 'provider', values);
        p.delete('page');
      }),
    [update],
  );

  const setOwner = useCallback(
    (values: string[]) =>
      update(p => {
        writeArray(p, 'owner', values);
        p.delete('page');
      }),
    [update],
  );

  const setTag = useCallback(
    (values: string[]) =>
      update(p => {
        writeArray(p, 'tag', values);
        p.delete('page');
      }),
    [update],
  );

  const setViewMode = useCallback(
    (mode: ViewMode) =>
      update(p => {
        if (mode === 'grid') {
          p.delete('view');
        } else {
          p.set('view', mode);
        }
      }),
    [update],
  );

  const setPage = useCallback(
    (p: number) =>
      update(params => {
        if (p === 0) {
          params.delete('page');
        } else {
          params.set('page', String(p));
        }
      }),
    [update],
  );

  const setPageSize = useCallback(
    (size: number) =>
      update(p => {
        p.set('pageSize', String(size));
        p.delete('page');
      }),
    [update],
  );

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
    setSearchInputValue('');
    setDebouncedSearch('');
  }, [setSearchParams]);

  const filters: AiAssetFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      category: category.length > 0 ? category : undefined,
      provider: provider.length > 0 ? provider : undefined,
      tags: tag.length > 0 ? tag : undefined,
      owner: owner.length > 0 ? owner : undefined,
    }),
    [debouncedSearch, category, provider, tag, owner],
  );

  return {
    filters,
    searchInputValue,
    viewMode,
    page,
    pageSize,
    setSearch,
    setCategory,
    setProvider,
    setOwner,
    setTag,
    setViewMode,
    setPage,
    setPageSize,
    clearFilters,
  };
}
