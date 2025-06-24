/*
 * Copyright The Backstage Authors
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

import type { ChangeEvent } from 'react';

import { useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const fullTextSearchParam = 'q';
const clearOtherParams = ['page'];

export const useQueryFullTextSearch = (debounce?: number) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const current = searchParams.get(fullTextSearchParam) ?? '';

  const onChangeDebounceTimeout = useRef<ReturnType<typeof setTimeout>>();

  const set = useCallback(
    (newValue: string) => {
      setSearchParams(params => {
        if (!newValue) {
          params.delete(fullTextSearchParam);
        } else {
          params.set(fullTextSearchParam, newValue);
        }
        clearOtherParams.forEach(param => params.delete(param));
        return params;
      });
    },
    [setSearchParams],
  );

  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      if (debounce && debounce > 0) {
        clearTimeout(onChangeDebounceTimeout.current);
        onChangeDebounceTimeout.current = setTimeout(
          () => set(newValue),
          debounce,
        );
      } else {
        set(newValue);
      }
    },
    [debounce, set],
  );

  const clear = useCallback(() => {
    setSearchParams(
      params => {
        params.delete(fullTextSearchParam);
        clearOtherParams.forEach(param => params.delete(param));
        return params;
      },
      {
        replace: true,
      },
    );
  }, [setSearchParams]);

  return useMemo(
    () =>
      ({
        current,
        set,
        onChange,
        clear,
      }) as const,
    [current, set, onChange, clear],
  );
};
