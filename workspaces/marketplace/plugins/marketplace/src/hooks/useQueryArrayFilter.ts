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

import { SelectItem } from '@backstage/core-components';
import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

const filterSearchParam = 'filter';

const evaluateParams = (
  newValues: (string | number)[],
  newParams: URLSearchParams,
  filterName: string,
) => {
  newValues.forEach(v => {
    newParams.append(filterSearchParam, `${filterName}=${v}`);
  });
};

export const useQueryArrayFilter = (filterName: string) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const current = useMemo(() => {
    return searchParams
      .getAll(filterSearchParam)
      .reduce((acc, keyValuePair) => {
        const firstEqualIndex = keyValuePair.indexOf('=');
        if (firstEqualIndex === -1) {
          return acc;
        }
        const name = keyValuePair.substring(0, firstEqualIndex);
        const value = keyValuePair.substring(firstEqualIndex + 1);
        if (name === filterName) {
          acc.push({ label: value, value });
        }
        return acc;
      }, [] as SelectItem[]);
  }, [filterName, searchParams]);

  const set = useCallback(
    (newValues: (string | number)[]) => {
      setSearchParams(
        params => {
          const newParams = new URLSearchParams();

          let added = false;
          const add = () => {
            if (added) return;
            evaluateParams(newValues, newParams, filterName);
            added = true;
          };

          // Try to keep the right position...
          params.forEach((value, key) => {
            if (
              key === filterSearchParam &&
              value.startsWith(`${filterName}=`)
            ) {
              add();
            } else {
              newParams.append(key, value);
            }
          });

          // If not added yet, add it at the end
          add();

          return newParams;
        },
        {
          replace: true,
        },
      );
    },
    [filterName, setSearchParams],
  );

  const clear = useCallback(() => {
    setSearchParams(
      params => {
        const newParams = new URLSearchParams();

        params.forEach((value, key) => {
          const isCurrentFilter =
            key === filterSearchParam && value.startsWith(`${filterName}=`);
          if (!isCurrentFilter) {
            newParams.append(key, value);
          }
        });

        return newParams;
      },
      {
        replace: true,
      },
    );
  }, [filterName, setSearchParams]);

  return useMemo(
    () =>
      ({
        current,
        set,
        clear,
      }) as const,
    [current, set, clear],
  );
};
