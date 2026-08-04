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

import { useCallback, useEffect, useRef, useState } from 'react';
import { extractApiError } from '../utils/extractApiError';

/** Shape that fetch functions must return. */
export interface PaginatedPage<T> {
  items: T[];
  /** Opaque token for the next page, or empty/undefined when no next page exists. */
  nextPageToken: string;
}

/** Parameters passed to the fetch function on every request. */
export interface FetchParams {
  pageToken: string | undefined;
  pageSize: number;
}

export interface UsePaginatedFetchOptions<T> {
  /** Called for every page request (initial load, Next, Previous, refresh). */
  fetchFn: (params: FetchParams) => Promise<PaginatedPage<T>>;
  /** Number of items to request per page. */
  pageSize: number;
}

export interface UsePaginatedFetchResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  /** True when the last server response included a non-empty next_page_token. */
  hasNext: boolean;
  /** True when we have navigated past the first page. */
  hasPrev: boolean;
  goNext: () => void;
  goPrev: () => void;
  /** Re-fetches the current page without changing the cursor position. */
  refresh: () => void;
  /** Resets cursor to the first page and re-fetches. */
  resetToFirstPage: () => void;
}

/**
 * Generic cursor-based pagination hook.
 *
 * Maintains a stack of previously-visited page tokens so Previous navigation
 * is possible without any extra API knowledge. The fetch function is called
 * with `{ pageToken, pageSize }` on every page change and on `refresh()`.
 *
 * The token stack stores the tokens of ALL pages visited before the current
 * one. The current page token is kept in a ref so navigation handlers can
 * update it synchronously before the next fetch.
 *
 * @example
 * const { data, loading, error, hasNext, hasPrev, goNext, goPrev } =
 *   usePaginatedFetch({
 *     fetchFn: ({ pageToken, pageSize }) =>
 *       catalogApi.listServiceTypes({ page_token: pageToken, max_page_size: pageSize })
 *         .then(r => ({ items: r.results ?? [], nextPageToken: r.next_page_token })),
 *     pageSize,
 *   });
 */
export function usePaginatedFetch<T>(
  options: UsePaginatedFetchOptions<T>,
): UsePaginatedFetchResult<T> {
  // Keep a ref that always reflects the latest options so the stable `fetch`
  // callback never closes over stale values. Assigning inline (during render)
  // rather than inside a useEffect guarantees the ref is up-to-date when a
  // page-size change triggers a `resetToFirstPage` in a useEffect.
  const optsRef = useRef(options);
  optsRef.current = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextToken, setNextToken] = useState('');

  // Stack of tokens for pages BEFORE the current one. Length === number of
  // previously-visited pages, so hasPrev = tokenStack.length > 0.
  const [tokenStack, setTokenStack] = useState<string[]>([]);

  // Ref holding the token for the CURRENT page so fetch() can read it
  // synchronously even when navigation state hasn't re-rendered yet.
  const currentTokenRef = useRef<string | undefined>(undefined);

  // Mirrors tokenStack in a ref so goPrev can read the latest value
  // synchronously inside the click handler (before the next render).
  const tokenStackRef = useRef<string[]>([]);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    optsRef.current
      .fetchFn({
        pageToken: currentTokenRef.current,
        pageSize: optsRef.current.pageSize,
      })
      .then(page => {
        setData(page.items);
        setNextToken(page.nextPageToken ?? '');
      })
      .catch(err => {
        setError(extractApiError(err));
        setData([]);
        setNextToken('');
      })
      .finally(() => setLoading(false));
  }, []);

  // Initial load
  useEffect(() => {
    fetch();
  }, [fetch]);

  // When pageSize changes after the initial render, reset to the first page
  // automatically so consumers don't need to duplicate this effect.
  const prevPageSizeRef = useRef(options.pageSize);
  useEffect(() => {
    if (prevPageSizeRef.current !== options.pageSize) {
      prevPageSizeRef.current = options.pageSize;
      currentTokenRef.current = undefined;
      tokenStackRef.current = [];
      setTokenStack([]);
      setNextToken('');
      fetch();
    }
  }, [options.pageSize, fetch]);

  const goNext = useCallback(() => {
    // Capture the current-page token as a plain string BEFORE mutating the ref
    // so the setTokenStack call below closes over the right value regardless of
    // when React schedules the state-updater function.
    const tokenToPush = currentTokenRef.current ?? '';
    currentTokenRef.current = nextToken || undefined;
    tokenStackRef.current = [...tokenStackRef.current, tokenToPush];
    setTokenStack(tokenStackRef.current);
    fetch();
  }, [fetch, nextToken]);

  const goPrev = useCallback(() => {
    const stack = tokenStackRef.current;
    const prevToken = stack.at(-1);
    currentTokenRef.current = prevToken || undefined;
    tokenStackRef.current = stack.slice(0, -1);
    setTokenStack(tokenStackRef.current);
    fetch();
  }, [fetch]);

  const refresh = useCallback(() => {
    fetch();
  }, [fetch]);

  const resetToFirstPage = useCallback(() => {
    currentTokenRef.current = undefined;
    tokenStackRef.current = [];
    setTokenStack([]);
    setNextToken('');
    fetch();
  }, [fetch]);

  return {
    data,
    loading,
    error,
    hasNext: Boolean(nextToken),
    hasPrev: tokenStack.length > 0,
    goNext,
    goPrev,
    refresh,
    resetToFirstPage,
  };
}
