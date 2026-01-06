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

import { useApi, fetchApiRef } from '@backstage/core-plugin-api';
import { JsonObject } from '@backstage/types';
import { useState } from 'react';
import { UiProps } from '../uiPropTypes';
import { getErrorMessage } from './errorUtils';
import { useEvaluateTemplate } from './evaluateTemplate';
import { useRequestInit } from './useRequestInit';
import { useRetriggerEvaluate } from './useRetriggerEvaluate';
import { useDebounce } from 'react-use';
import { DEFAULT_DEBOUNCE_LIMIT } from '../widgets/constants';

/**
 * Checks if all fetch:retrigger dependencies have non-empty values.
 * Used to determine if a fetch error should be shown or suppressed.
 */
const areRetriggerDependenciesSatisfied = (
  retrigger: ReturnType<typeof useRetriggerEvaluate>,
): boolean => {
  // If no retrigger conditions, dependencies are satisfied
  if (!retrigger || retrigger.length === 0) {
    return true;
  }
  // All values must be non-empty
  return retrigger.every(
    value => value !== undefined && value !== null && value !== '',
  );
};

export const useFetch = (
  formData: JsonObject,
  uiProps: UiProps,
  retrigger: ReturnType<typeof useRetriggerEvaluate>,
) => {
  const fetchApi = useApi(fetchApiRef);

  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<JsonObject>();

  const fetchUrl = uiProps['fetch:url'];
  const skipErrorWhenDepsEmpty = uiProps['fetch:error:ignoreUnready'] === true;
  const evaluatedRequestInit = useRequestInit({
    uiProps,
    prefix: 'fetch',
    formData,
    setError,
  });
  const evaluatedFetchUrl = useEvaluateTemplate({
    template: fetchUrl ?? '',
    key: 'fetch:url',
    formData,
    setError,
  });

  useDebounce(
    () => {
      if (
        !fetchUrl ||
        !evaluatedFetchUrl ||
        !evaluatedRequestInit ||
        !retrigger
      ) {
        setLoading(false);
        return;
      }

      const fetchData = async () => {
        try {
          setError(undefined);
          if (typeof evaluatedFetchUrl !== 'string') {
            // eslint-disable-next-line no-console
            console.error('The fetch:url is not evaluated to a string: ', {
              fetchUrl,
              evaluatedFetchUrl,
            });
            setError(
              `The fetch:url is not evaluated to a string: "${fetchUrl}"`,
            );
            return;
          }

          setLoading(true);

          const response = await fetchApi.fetch(
            evaluatedFetchUrl,
            evaluatedRequestInit,
          );
          if (!response.ok) {
            throw new Error(
              `Request ${evaluatedFetchUrl} returned status ${response.status}. Status text: ${response.statusText}.`,
            );
          }
          const responseData = (await response.json()) as JsonObject;

          // validate received response before updating
          if (!responseData) {
            throw new Error('Empty response received');
          }
          if (typeof responseData !== 'object') {
            throw new Error('JSON object expected');
          }

          setData(responseData);
        } catch (err) {
          const prefix = `Failed to fetch data for url ${fetchUrl}.`;
          // eslint-disable-next-line no-console
          console.error(prefix, err);
          setError(getErrorMessage(prefix, err));
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    },
    DEFAULT_DEBOUNCE_LIMIT,
    [
      evaluatedFetchUrl,
      evaluatedRequestInit,
      fetchApi,
      fetchUrl,
      // no need to expand the "retrigger" array here since its identity changes only if an item changes
      retrigger,
    ],
  );

  // If fetch:error:ignoreUnready is enabled and retrigger dependencies are not satisfied,
  // suppress the error. This handles the case where initial fetch fails because
  // dependent fields don't have values yet.
  const shouldSkipError =
    skipErrorWhenDepsEmpty && !areRetriggerDependenciesSatisfied(retrigger);
  const effectiveError = shouldSkipError ? undefined : error;

  return { data, error: effectiveError, loading };
};
