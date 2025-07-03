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

export function useLocalStorageState<T extends string | number | boolean>(
  key: string,
  defaultValue: T,
  isAllowed: boolean,
): [T, (value: T) => void] {
  const readValue = useCallback((): T => {
    try {
      const stored = localStorage.getItem(key);
      return isAllowed && stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }, [defaultValue, isAllowed, key]);

  const [value, setValue] = useState<T>(readValue);

  useEffect(() => {
    const interval = setInterval(() => {
      const local = readValue();
      setValue(prev => (prev !== local ? local : prev));
    }, 500);
    return () => clearInterval(interval);
  }, [readValue]);

  const updateValue = (newValue: T) => {
    setValue(newValue);
    localStorage.setItem(key, JSON.stringify(newValue));
  };

  return [value, updateValue];
}
