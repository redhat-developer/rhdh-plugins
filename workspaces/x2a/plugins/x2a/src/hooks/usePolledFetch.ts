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
import equal from 'fast-deep-equal';
import { POLLING_INTERVAL_MS } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

export interface UsePolledFetchResult<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | undefined;
  /** Restart the polling cycle immediately without showing a loading indicator. */
  refetch: () => void;
}

/**
 * Fetches data via `fetchFn`, then re-fetches every `POLLING_INTERVAL_MS`.
 *
 * - When external `deps` change, `loading` resets to `true` and the previous
 *   error is cleared so that the caller can show a loading indicator while
 *   fetching genuinely different data (e.g. a new page or sort order).
 * - Calling `refetch()` restarts the polling cycle without toggling the
 *   loading flag, providing a seamless background refresh after user actions.
 * - A deep-equal check prevents unnecessary re-renders when polled data is
 *   identical to the current state.
 *
 * @param fetchFn  Async function that returns the data. All values it closes
 *                 over must also appear in `deps` so the effect re-runs
 *                 when they change.
 * @param deps     Dependency array – the effect re-runs when any value changes.
 * @param options  Optional `initialData` to skip the initial loading state.
 */
export function usePolledFetch<T>(
  fetchFn: () => Promise<T>,
  deps: unknown[],
  options?: { initialData?: T },
): UsePolledFetchResult<T> {
  const [data, setData] = useState<T | undefined>(options?.initialData);
  const [loading, setLoading] = useState(options?.initialData === undefined);
  const [error, setError] = useState<Error>();
  const [refreshCounter, setRefreshCounter] = useState(0);

  const isFirstRunRef = useRef(true);
  const skipLoadingRef = useRef(false);

  useEffect(() => {
    let aborted = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    if (isFirstRunRef.current) {
      isFirstRunRef.current = false;
    } else if (!skipLoadingRef.current) {
      setLoading(true);
      setError(undefined);
    }
    skipLoadingRef.current = false;

    const fetchData = async () => {
      try {
        const result = await fetchFn();
        if (!aborted) {
          setData(prev =>
            prev !== undefined && equal(prev, result) ? prev : result,
          );
          setError(undefined);
          setLoading(false);
        }
      } catch (e) {
        if (!aborted) {
          setError(e instanceof Error ? e : new Error(String(e)));
          setLoading(false);
        }
      }

      if (!aborted) {
        timeoutId = setTimeout(fetchData, POLLING_INTERVAL_MS);
      }
    };

    fetchData();

    return () => {
      aborted = true;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, refreshCounter]);

  const refetch = useCallback(() => {
    skipLoadingRef.current = true;
    setRefreshCounter(prev => prev + 1);
  }, []);

  return { data, loading, error, refetch };
}
