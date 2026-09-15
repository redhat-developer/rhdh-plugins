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

import { useCallback, useEffect, useState } from 'react';

import { useApi } from '@backstage/core-plugin-api';

import { learningPathApiRef } from '../api/LearningPathApiClient';
import { parseLearningPathLinks } from '../api/parseLearningPathLinks';
import { LearningPathLink } from '../types';

/** @internal */
export const useLearningPathData = (): {
  data: LearningPathLink[] | undefined;
  error: Error | undefined;
  isLoading: boolean;
} => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<LearningPathLink[]>();
  const [error, setError] = useState<Error>();
  const client = useApi(learningPathApiRef);

  const fetchFallbackData = useCallback(async () => {
    const res = await fetch('/learning-paths/data.json');
    if (!res.ok) {
      throw new Error(
        `failed to fetch fallback data, status ${res.status}: ${res.statusText}`,
      );
    }
    return parseLearningPathLinks(await res.json());
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(undefined);

      try {
        const value = await client.getLearningPathData();
        if (!cancelled) {
          setData(value);
          setIsLoading(false);
        }
      } catch (apiError) {
        // eslint-disable-next-line no-console
        console.warn(
          'Learning paths proxy request failed, using static fallback data.',
          apiError,
        );
        try {
          const fallbackData = await fetchFallbackData();
          if (!cancelled) {
            setData(fallbackData);
            setError(undefined);
            setIsLoading(false);
          }
        } catch (fallbackError) {
          if (!cancelled) {
            setError(
              fallbackError instanceof Error
                ? fallbackError
                : new Error(String(fallbackError)),
            );
            setIsLoading(false);
          }
        }
      }
    };

    load().catch(err => {
      if (!cancelled) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [client, fetchFallbackData]);

  return { data, error, isLoading };
};
