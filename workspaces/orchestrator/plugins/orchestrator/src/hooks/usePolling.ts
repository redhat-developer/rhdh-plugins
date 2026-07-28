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

import useSwr, { useSWRConfig } from 'swr';
import * as uuid from 'uuid';

import { LONG_REFRESH_INTERVAL } from '../constants';

export type UsePollingOptions<T> = {
  delayMs?: number;
  continueRefresh?: (value: T | undefined) => boolean;
  maxErrorRetryCount?: number;
  cacheKey?: string;
  persistCache?: boolean;
};

const usePolling = <T>(
  fn: () => Promise<T>,
  delayMsOrOptions: number | UsePollingOptions<T> = LONG_REFRESH_INTERVAL,
  continueRefresh?: (value: T | undefined) => boolean,
  maxErrorRetryCount: number = 3,
) => {
  const {
    delayMs = LONG_REFRESH_INTERVAL,
    continueRefresh: shouldContinueRefresh = continueRefresh,
    maxErrorRetryCount: maxRetries = maxErrorRetryCount,
    cacheKey,
    persistCache = Boolean(cacheKey),
  } = typeof delayMsOrOptions === 'number'
    ? {
        delayMs: delayMsOrOptions,
        continueRefresh,
        maxErrorRetryCount,
      }
    : delayMsOrOptions;

  const config = useSWRConfig();

  const prevFn = useRef(fn);
  const generatedKey = useMemo<string>(() => uuid.v4(), []);
  const uniqueKey = cacheKey ?? generatedKey;

  const [error, setError] = useState();
  const isInitalLoad = useRef(true);

  const { data, isLoading } = useSwr<T>(uniqueKey, fn, {
    refreshInterval: (value_: T | undefined) => {
      return !shouldContinueRefresh || shouldContinueRefresh(value_)
        ? delayMs
        : 0;
    },
    shouldRetryOnError: true,
    onErrorRetry: (curError, _key, _config, revalidate, { retryCount }) => {
      // requires custom behavior, retryErrorCount option doesn't support hiding the error before reaching the maximum
      if (isInitalLoad.current || retryCount >= maxRetries) {
        setError(curError);
      } else {
        setTimeout(() => revalidate({ retryCount }), delayMs);
      }
    },
    onSuccess: () => {
      isInitalLoad.current = false;
    },
    revalidateOnFocus: false, // click on sort will result in two calls to backend if not disabled
  });

  const restart = useCallback(
    () => config.mutate(uniqueKey),
    [config, uniqueKey],
  );

  useEffect(() => {
    if (prevFn.current !== fn) {
      restart();
      prevFn.current = fn;
    }
  }, [fn, restart]);

  useEffect(() => {
    if (persistCache) {
      return undefined;
    }
    // clean cache after unmount, no need to store the data globally
    return () => config.cache.delete(uniqueKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    value: data,
    error,
    loading: isLoading,
    restart,
  };
};

export default usePolling;
