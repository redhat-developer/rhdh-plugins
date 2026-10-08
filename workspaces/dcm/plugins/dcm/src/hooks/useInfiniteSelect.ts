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
import { extractApiError } from '@red-hat-developer-hub/backstage-plugin-dcm-common';

export type InfiniteSelectResult<T> = {
  items: T[];
  /** True while the first page is being fetched. */
  loading: boolean;
  /** True while a subsequent page is being fetched. */
  loadingMore: boolean;
  error: string | null;
  /**
   * Fetch the next page and append results to `items`.
   * No-op when there are no more pages or a fetch is already in-flight.
   */
  loadMore: () => void;
};

/**
 * Manages a paginated list for a Select dropdown:
 * - Loads the first page (100 items) automatically on mount.
 * - Exposes `loadMore()` to append the next page, intended to be called from
 *   a scroll handler on the dropdown's `MenuListProps.onScroll`.
 *
 * The `fetcher` receives `undefined` for the first page and the
 * `next_page_token` from each previous response for subsequent pages.
 * Changes to `fetcher` between renders are applied via a ref so the initial
 * fetch does not re-run on every render.
 */
export function useInfiniteSelect<T>(
  fetcher: (pageToken?: string) => Promise<{
    results?: T[];
    next_page_token?: string;
  }>,
): InfiniteSelectResult<T> {
  // Keep the latest fetcher in a ref so loadMore always uses the current one
  // without causing the initial useEffect to re-run.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [items, setItems] = useState<T[]>([]);
  const [nextToken, setNextToken] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch the first page on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let active = true;

    setLoading(true);
    setItems([]);
    setNextToken(undefined);
    setError(null);

    fetcherRef
      .current(undefined)
      .then(r => {
        if (!active) return;
        setItems(r.results ?? []);
        setNextToken(r.next_page_token);
      })
      .catch(err => {
        if (!active) return;
        setError(extractApiError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []); // intentionally empty — re-fetch is triggered by explicit loadMore()

  const loadMore = useCallback(() => {
    if (!nextToken || loadingMore) return;
    setLoadingMore(true);
    fetcherRef
      .current(nextToken)
      .then(r => {
        setItems(prev => [...prev, ...(r.results ?? [])]);
        setNextToken(r.next_page_token);
      })
      .catch(err => setError(extractApiError(err)))
      .finally(() => setLoadingMore(false));
  }, [nextToken, loadingMore]);

  return { items, loading, loadingMore, error, loadMore };
}
